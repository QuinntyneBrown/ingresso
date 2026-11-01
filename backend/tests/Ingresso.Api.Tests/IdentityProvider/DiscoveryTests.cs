using System.Net;
using System.Text.Json;
using Ingresso.Api.Tests.Infrastructure;

namespace Ingresso.Api.Tests.IdentityProvider;

/// <summary>L2-091: the discovery document and the public signing keys.</summary>
public sealed class DiscoveryTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    // Acceptance Test
    // Traces to: L2-091
    // Description: Discovery names the issuer (the public base URL) and the endpoints on the requested origin, and offers only the code flow with S256 PKCE.
    [Fact]
    public async Task Discovery_offers_only_the_code_flow_with_s256()
    {
        var response = await factory.CreateHttpsClient().GetAsync("/.well-known/openid-configuration");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var root = json.RootElement;
        Assert.Equal("https://ingresso.dev/", root.GetProperty("issuer").GetString());
        Assert.Equal("https://localhost/connect/authorize", root.GetProperty("authorization_endpoint").GetString());
        Assert.Equal("https://localhost/connect/token", root.GetProperty("token_endpoint").GetString());
        Assert.Equal("https://localhost/.well-known/jwks", root.GetProperty("jwks_uri").GetString());
        Assert.Equal(["code"], Strings(root.GetProperty("response_types_supported")));
        Assert.Equal(["S256"], Strings(root.GetProperty("code_challenge_methods_supported")));
    }

    // Acceptance Test
    // Traces to: L2-091
    // Description: The JWKS holds a public signing key and no private key material.
    [Fact]
    public async Task Jwks_publishes_public_signing_keys_only()
    {
        var response = await factory.CreateHttpsClient().GetAsync("/.well-known/jwks");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var keys = json.RootElement.GetProperty("keys").EnumerateArray().ToList();
        Assert.Contains(keys, k => k.GetProperty("use").GetString() == "sig");
        foreach (var key in keys)
        {
            foreach (var secret in new[] { "d", "p", "q", "dp", "dq", "qi", "k" })
            {
                Assert.False(key.TryGetProperty(secret, out _), $"JWKS key exposes private member '{secret}'");
            }
        }
    }

    private static string[] Strings(JsonElement array) => array.EnumerateArray().Select(e => e.GetString()!).ToArray();
}
