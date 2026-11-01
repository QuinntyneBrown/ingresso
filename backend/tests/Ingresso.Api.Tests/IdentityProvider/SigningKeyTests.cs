using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text.Json;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Ingresso.Api.Tests.Infrastructure;

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
