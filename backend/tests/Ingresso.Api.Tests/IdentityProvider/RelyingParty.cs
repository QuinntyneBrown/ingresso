using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;
using Ingresso.Api.Tests.Infrastructure;
using Ingresso.Application.Clients;
using Ingresso.Application.Common.Interfaces;

namespace Ingresso.Api.Tests.IdentityProvider;

/// <summary>Plays a registered app: builds authorization requests with PKCE, exchanges codes and checks ID tokens.</summary>
public sealed class RelyingParty
{
    public const string RedirectUri = "https://app.example.com/signin-oidc";

    private RelyingParty(ApiFactory factory, string clientId)
    {
        Factory = factory;
        ClientId = clientId;
    }

    public ApiFactory Factory { get; }

    public string ClientId { get; }

    public string Verifier { get; } = Base64Url(RandomNumberGenerator.GetBytes(32));

    public string State { get; } = Guid.NewGuid().ToString("N");

    public string Nonce { get; } = Guid.NewGuid().ToString("N");

    public string Challenge => Base64Url(SHA256.HashData(Encoding.ASCII.GetBytes(Verifier)));

    public static async Task<RelyingParty> RegisterAsync(ApiFactory factory, string name = "Sample app")
    {
        factory.CreateHttpsClient().Dispose(); // creates and seeds the database
        using var scope = factory.Services.CreateScope();
        var registry = scope.ServiceProvider.GetRequiredService<IClientRegistry>();
        var clientId = await registry.RegisterAsync(new NewClient($"{name} {Guid.NewGuid():N}", [RedirectUri], []), CancellationToken.None);
        return new RelyingParty(factory, clientId);
    }

    /// <summary>The authorization request path, with any parameter overridden or removed (null).</summary>
    public string AuthorizePath(IDictionary<string, string?>? overrides = null)
    {
        var parameters = new Dictionary<string, string?>
        {
            ["client_id"] = ClientId,
            ["redirect_uri"] = RedirectUri,
            ["response_type"] = "code",
            ["scope"] = "openid email",
            ["state"] = State,
            ["nonce"] = Nonce,
            ["code_challenge"] = Challenge,
            ["code_challenge_method"] = "S256",
        };
        foreach (var (key, value) in overrides ?? new Dictionary<string, string?>())
        {
            parameters[key] = value;
        }

        return QueryHelpers.AddQueryString("/connect/authorize", parameters.Where(p => p.Value is not null).ToDictionary(p => p.Key, p => p.Value));
    }

    /// <summary>The query parameters of a redirect back to the app.</summary>
    public static Dictionary<string, string> CallbackParameters(HttpResponseMessage response) =>
        QueryHelpers.ParseQuery(response.Headers.Location!.Query).ToDictionary(p => p.Key, p => p.Value.ToString());

    public async Task<HttpResponseMessage> ExchangeAsync(string code, string? verifier = null) =>
        await Factory.CreateHttpsClient().PostAsync("/connect/token", new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["grant_type"] = "authorization_code",
            ["client_id"] = ClientId,
            ["redirect_uri"] = RedirectUri,
            ["code"] = code,
            ["code_verifier"] = verifier ?? Verifier,
        }));

    /// <summary>Validates an ID token's signature against the published JWKS, its issuer and its audience.</summary>
    public async Task<JsonWebToken> ValidateIdTokenAsync(string idToken)
    {
        var jwks = new JsonWebKeySet(await Factory.CreateHttpsClient().GetStringAsync("/.well-known/jwks"));
        var result = await new JsonWebTokenHandler().ValidateTokenAsync(idToken, new TokenValidationParameters
        {
            IssuerSigningKeys = jwks.GetSigningKeys(),
            ValidIssuer = "https://ingresso.dev/",
            ValidAudience = ClientId,
        });
        Assert.True(result.IsValid, result.Exception?.Message);
        return (JsonWebToken)result.SecurityToken;
    }

    public static async Task<JsonElement> JsonAsync(HttpResponseMessage response) =>
        JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement.Clone();

    private static string Base64Url(byte[] bytes) => Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');
}
