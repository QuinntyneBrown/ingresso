using System.Net;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text.Json;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using MediatR;
using Ingresso.Api.Auth;
using Ingresso.Api.Tests.Infrastructure;
using Ingresso.Application.SigningKeys;

namespace Ingresso.Api.Tests.IdentityProvider;

/// <summary>L2-136 to L2-140: signing keys live in the database, encrypted, and rotate without breaking tokens.</summary>
public sealed class SigningKeyTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private static JsonElement Header(string jwt) =>
        JsonDocument.Parse(Base64UrlDecode(jwt.Split('.')[0])).RootElement;

    private static byte[] Base64UrlDecode(string value) =>
        Convert.FromBase64String(value.Replace('-', '+').Replace('_', '/').PadRight(value.Length + (4 - value.Length % 4) % 4, '='));

    private async Task<List<JsonElement>> JwksAsync() =>
        (await factory.CreateHttpsClient().GetFromJsonAsync<JsonElement>("/.well-known/jwks")).GetProperty("keys").EnumerateArray().ToList();

    private async Task<string> IdTokenAsync()
    {
        var app = await RelyingParty.RegisterAsync(factory);
        var browser = factory.CreateHttpsClient();
        await browser.SignInAsAsync(HttpClientExtensions.DevUser);
        return await app.SignInAsync(browser);
    }

    // Acceptance Test
    // Traces to: L2-137, L2-136
    // Description: Tokens are signed with the active key stored in the database, and the JWKS publishes it.
    [Fact]
    public async Task Tokens_are_signed_with_the_stored_active_key()
    {
        var idToken = await IdTokenAsync();

        var stored = await factory.WithDbAsync(db => db.SigningKeys.Where(k => k.RetiredAtUtc == null).ToListAsync());

        var active = Assert.Single(stored);
        Assert.Equal(active.Kid, Header(idToken).GetProperty("kid").GetString());
        Assert.Contains(await JwksAsync(), k => k.GetProperty("kid").GetString() == active.Kid);
    }

    // Acceptance Test
    // Traces to: L2-139
    // Description: A stored key holds only Data Protection ciphertext, which decrypts to the published public key.
    [Fact]
    public async Task Signing_keys_are_encrypted_at_rest()
    {
        await IdTokenAsync();
        var active = await factory.WithDbAsync(db => db.SigningKeys.SingleAsync(k => k.RetiredAtUtc == null));

        Assert.DoesNotContain("PRIVATE KEY", active.ProtectedKey);
        Assert.ThrowsAny<Exception>(() =>
        {
            using var plain = RSA.Create();
            plain.ImportPkcs8PrivateKey(Base64UrlDecode(active.ProtectedKey), out _);
        });

        var protector = factory.Services.GetRequiredService<IDataProtectionProvider>().CreateProtector("Ingresso.SigningKeys");
        using var rsa = RSA.Create();
        rsa.ImportPkcs8PrivateKey(Convert.FromBase64String(protector.Unprotect(active.ProtectedKey)), out _);
        var published = (await JwksAsync()).Single(k => k.GetProperty("kid").GetString() == active.Kid);
        Assert.Equal(rsa.ExportParameters(false).Modulus, Base64UrlDecode(published.GetProperty("n").GetString()!));
    }

    /// <summary>Rotates as <c>keys rotate</c> does, then runs the API's key check, as it does every minute.</summary>
    private async Task<RotatedSigningKey> RotateAsync()
    {
        using var scope = factory.Services.CreateScope();
        var rotated = await scope.ServiceProvider.GetRequiredService<IMediator>().Send(new RotateSigningKeyCommand());
        await factory.Services.GetRequiredService<SigningKeyMaintenance>().RunOnceAsync(CancellationToken.None);
        return rotated;
    }

    // Acceptance Test
    // Traces to: L2-136, L2-137
    // Description: After a rotation new tokens carry the new key's kid, the JWKS lists both keys, and an access token signed before still works.
    [Fact]
    public async Task After_a_rotation_new_tokens_use_the_new_key_and_earlier_tokens_keep_working()
    {
        var app = await RelyingParty.RegisterWithOfflineAccessAsync(factory);
        var before = await app.SignInOfflineAsync();
        var previousKid = Header(before.GetProperty("id_token").GetString()!).GetProperty("kid").GetString();

        var rotated = await RotateAsync();

        Assert.NotEqual(previousKid, rotated.ActiveKid);
        Assert.Equal(previousKid, rotated.RetiringKid);
        Assert.Equal(ApiFactory.Today.AddDays(14), rotated.PublishedUntil);
        var refreshed = await RelyingParty.JsonAsync(await app.RefreshAsync(before.GetProperty("refresh_token").GetString()!));
        Assert.Equal(rotated.ActiveKid, Header(refreshed.GetProperty("id_token").GetString()!).GetProperty("kid").GetString());
        var kids = (await JwksAsync()).Select(k => k.GetProperty("kid").GetString()).ToList();
        Assert.Contains(rotated.ActiveKid, kids);
        Assert.Contains(previousKid, kids);
        var userinfo = new HttpRequestMessage(HttpMethod.Get, "/connect/userinfo");
        userinfo.Headers.Authorization = new("Bearer", before.GetProperty("access_token").GetString());
        Assert.Equal(HttpStatusCode.OK, (await factory.CreateHttpsClient().SendAsync(userinfo)).StatusCode);
    }

    // Acceptance Test
    // Traces to: L2-139
    // Description: Outside Development and Testing the API refuses to start unless a certificate protects the Data Protection key ring.
    [Fact]
    public void Outside_development_the_key_ring_needs_a_certificate()
    {
        using var production = new ProductionWithoutDataProtectionCertificate();

        var error = Assert.Throws<InvalidOperationException>(() => production.CreateClient());

        Assert.Contains("DataProtection:Certificate:Path", error.Message);
    }

    private sealed class ProductionWithoutDataProtectionCertificate : ApiFactory
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            base.ConfigureWebHost(builder);
            builder.UseEnvironment("Production");
            builder.UseSetting("IdentityProvider:SigningCertificate:Path", TestSigningCertificate.Path);
        }
    }
}
