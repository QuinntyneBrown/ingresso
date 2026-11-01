using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Primitives;
using Microsoft.IdentityModel.Tokens;
using Ingresso.Application.Common.Interfaces;
using Ingresso.Application.SigningKeys;
using Ingresso.Domain.Enums;

namespace Ingresso.Infrastructure.Identity;

/// <summary>
/// The active and retiring signing keys, decrypted, for OpenIddict to sign with, validate with and publish
/// (L2-137, L2-138). Each is an X.509 key over a self-signed certificate made in memory: a newer key's certificate
/// expires later, and OpenIddict signs with the credential whose certificate expires last, so the active key signs.
/// </summary>
public sealed class SigningKeyRing(
    IServiceScopeFactory scopes, IDataProtectionProvider dataProtection, SigningKeyPolicy policy, ILogger<SigningKeyRing> logger)
{
    /// <summary>
    /// Used only while the database can't be read, so requests that don't need tokens still work; the next reload
    /// that succeeds replaces it. Tokens can't be issued without the database anyway.
    /// </summary>
    private static readonly Lazy<X509SecurityKey> Unavailable = new(() =>
    {
        using var rsa = RSA.Create(2048);
        var request = new CertificateRequest("CN=ingresso signing key unavailable", rsa, HashAlgorithmName.SHA256, RSASignaturePadding.Pkcs1);
        return new X509SecurityKey(request.CreateSelfSigned(DateTimeOffset.UnixEpoch, DateTimeOffset.UnixEpoch.AddYears(100)), "unavailable");
    });

    private readonly Lock gate = new();
    private readonly Dictionary<string, X509SecurityKey> decrypted = new(StringComparer.Ordinal);
    private IReadOnlyList<X509SecurityKey>? keys;
    private CancellationTokenSource changed = new();

    /// <summary>The published keys, newest first; loaded (and the first key created) on first use.</summary>
    public IReadOnlyList<X509SecurityKey> Keys
    {
        get
        {
            if (keys is null)
            {
                try
                {
                    ReloadAsync(CancellationToken.None).GetAwaiter().GetResult();
                }
                catch (Exception ex)
                {
                    logger.LogWarning(ex, "Signing keys could not be loaded from the database; trying again on the next reload.");
                    lock (gate)
                    {
                        keys ??= [Unavailable.Value];
                    }
                }
            }

            return keys!;
        }
    }

    /// <summary>Fires when the published keys change, so OpenIddict rebuilds its options.</summary>
    public IChangeToken GetChangeToken()
    {
        lock (gate)
        {
            return new CancellationChangeToken(changed.Token);
        }
    }

    /// <summary>Reads the keys again, creating the first one when there is none; fires the change token when they changed.</summary>
    public async Task ReloadAsync(CancellationToken cancellationToken)
    {
        using var scope = scopes.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IAppDbContext>();
        var now = scope.ServiceProvider.GetRequiredService<IClock>().UtcNow;
        var stored = await db.SigningKeys.ToListAsync(cancellationToken);
        if (!stored.Any(k => k.RetiredAtUtc is null))
        {
            var first = scope.ServiceProvider.GetRequiredService<ISigningKeyFactory>().Create(now);
            db.SigningKeys.Add(first);
            await db.SaveChangesAsync(cancellationToken);
            stored.Add(first);
        }

        var published = stored
            .Where(k => k.State(now, policy.RetirementPeriod) != SigningKeyState.Retired)
            .OrderByDescending(k => k.CreatedAtUtc)
            .ToList();

        CancellationTokenSource? fire = null;
        lock (gate)
        {
            var next = published.Select(k => decrypted.TryGetValue(k.Kid, out var key) ? key : decrypted[k.Kid] = Decrypt(k.Kid, k.ProtectedKey, k.CreatedAtUtc)).ToList();
            if (keys is null || !keys.Select(k => k.KeyId).SequenceEqual(next.Select(k => k.KeyId)))
            {
                var first = keys is null;
                keys = next;
                if (!first)
                {
                    fire = changed;
                    changed = new CancellationTokenSource();
                }
            }
        }

        fire?.Cancel();
    }

    private X509SecurityKey Decrypt(string kid, string protectedKey, DateTimeOffset createdAt)
    {
        using var rsa = RSA.Create();
        rsa.ImportPkcs8PrivateKey(Convert.FromBase64String(dataProtection.CreateProtector(DataProtectionSigningKeyFactory.Purpose).Unprotect(protectedKey)), out _);
        var request = new CertificateRequest($"CN=ingresso signing key {kid}", rsa, HashAlgorithmName.SHA256, RSASignaturePadding.Pkcs1);
        // Valid from long ago, so OpenIddict never sees it as not yet valid; expiring later for newer keys.
        var certificate = request.CreateSelfSigned(DateTimeOffset.UnixEpoch, createdAt.AddYears(100));
        return new X509SecurityKey(certificate, kid);
    }
}
