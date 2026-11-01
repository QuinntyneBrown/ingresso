using System.Net;
using Ingresso.Api.Tests.Infrastructure;

namespace Ingresso.Api.Tests.IdentityProvider;

/// <summary>L2-107 to L2-111: refresh tokens for apps allowed offline access.</summary>
public sealed class RefreshTokenTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    // Acceptance Test
    // Traces to: L2-107
    // Description: An app allowed offline access that asks for offline_access gets a refresh token with its first tokens.
    [Fact]
    public async Task An_app_allowed_offline_access_gets_a_refresh_token()
    {
        var app = await RelyingParty.RegisterWithOfflineAccessAsync(factory);

        var tokens = await app.SignInOfflineAsync();

        Assert.False(string.IsNullOrEmpty(tokens.GetProperty("refresh_token").GetString()));
    }

    // Acceptance Test
    // Traces to: L2-107
    // Description: The refresh token gets new access, ID and refresh tokens without the person seeing ingresso.
    [Fact]
    public async Task A_refresh_token_gets_new_tokens()
    {
        var app = await RelyingParty.RegisterWithOfflineAccessAsync(factory);
        var first = await app.SignInOfflineAsync();

        var response = await app.RefreshAsync(first.GetProperty("refresh_token").GetString()!);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var renewed = await RelyingParty.JsonAsync(response);
        Assert.False(string.IsNullOrEmpty(renewed.GetProperty("access_token").GetString()));
        Assert.False(string.IsNullOrEmpty(renewed.GetProperty("id_token").GetString()));
        Assert.NotEqual(first.GetProperty("refresh_token").GetString(), renewed.GetProperty("refresh_token").GetString());
    }

    // Acceptance Test
    // Traces to: L2-107
    // Description: An app not allowed offline access that asks for offline_access gets no code.
    [Fact]
    public async Task An_app_not_allowed_offline_access_gets_no_code_for_offline_access()
    {
        var app = await RelyingParty.RegisterAsync(factory);
        var browser = factory.CreateHttpsClient();
        await browser.SignInAsAsync(HttpClientExtensions.DevUser);

        var response = await browser.GetAsync(app.AuthorizePath(new Dictionary<string, string?> { ["scope"] = "openid email offline_access" }));

        Assert.Equal(HttpStatusCode.Redirect, response.StatusCode);
        var location = response.Headers.Location!.OriginalString;
        Assert.DoesNotContain("code=", location);
    }

    // Acceptance Test
    // Traces to: L2-107
    // Description: An app allowed offline access that doesn't ask for it gets no refresh token, as before.
    [Fact]
    public async Task Without_offline_access_in_the_request_there_is_no_refresh_token()
    {
        var app = await RelyingParty.RegisterWithOfflineAccessAsync(factory);
        var browser = factory.CreateHttpsClient();
        await browser.SignInAsAsync(HttpClientExtensions.DevUser);

        var authorized = await browser.GetAsync(app.AuthorizePath());
        var tokens = await RelyingParty.JsonAsync(await app.ExchangeAsync(RelyingParty.CallbackParameters(authorized)["code"]));

        Assert.False(tokens.TryGetProperty("refresh_token", out _));
    }

    private static string RefreshTokenIn(System.Text.Json.JsonElement tokens) => tokens.GetProperty("refresh_token").GetString()!;

    private static async Task AssertInvalidGrantAsync(HttpResponseMessage response)
    {
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("invalid_grant", (await RelyingParty.JsonAsync(response)).GetProperty("error").GetString());
    }

    // Acceptance Test
    // Traces to: L2-108
    // Description: A refresh token that has been exchanged is refused when it is sent again.
    [Fact]
    public async Task A_refresh_token_works_once()
    {
        var app = await RelyingParty.RegisterWithOfflineAccessAsync(factory);
        var first = RefreshTokenIn(await app.SignInOfflineAsync());
        (await app.RefreshAsync(first)).EnsureSuccessStatusCode();

        await AssertInvalidGrantAsync(await app.RefreshAsync(first));
    }

    // Acceptance Test
    // Traces to: L2-108
    // Description: After a refresh token is reused, the newest refresh token from the same sign-in is refused too.
    [Fact]
    public async Task Reusing_a_refresh_token_revokes_the_chain()
    {
        var app = await RelyingParty.RegisterWithOfflineAccessAsync(factory);
        var first = RefreshTokenIn(await app.SignInOfflineAsync());
        var newest = RefreshTokenIn(await RelyingParty.JsonAsync(await app.RefreshAsync(first)));

        await app.RefreshAsync(first);

        await AssertInvalidGrantAsync(await app.RefreshAsync(newest));
    }

    // Acceptance Test
    // Traces to: L2-110
    // Description: After the person signs out of ingresso, a refresh token issued under that session is refused.
    [Fact]
    public async Task Signing_out_of_ingresso_stops_the_refresh_token()
    {
        var app = await RelyingParty.RegisterWithOfflineAccessAsync(factory);
        var browser = factory.CreateHttpsClient();
        await browser.SignInAsAsync(HttpClientExtensions.DevUser);
        var refreshToken = RefreshTokenIn(await app.SignInOfflineAsync(browser));

        (await browser.PostAsync("/api/auth/sign-out", null)).EnsureSuccessStatusCode();

        await AssertInvalidGrantAsync(await app.RefreshAsync(refreshToken));
    }

    // Acceptance Test
    // Traces to: L2-111
    // Description: A refresh token the app revokes is refused from then on.
    [Fact]
    public async Task A_revoked_refresh_token_is_refused()
    {
        var app = await RelyingParty.RegisterWithOfflineAccessAsync(factory);
        var refreshToken = RefreshTokenIn(await app.SignInOfflineAsync());

        var revoked = await app.RevokeAsync(refreshToken);

        Assert.Equal(HttpStatusCode.OK, revoked.StatusCode);
        await AssertInvalidGrantAsync(await app.RefreshAsync(refreshToken));
    }

    // Acceptance Test
    // Traces to: L2-111
    // Description: Revoking a token ingresso doesn't know still answers 200.
    [Fact]
    public async Task Revoking_an_unknown_token_answers_200()
    {
        var app = await RelyingParty.RegisterWithOfflineAccessAsync(factory);

        var response = await app.RevokeAsync("not-a-token");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    // Acceptance Test
    // Traces to: L2-111
    // Description: Discovery names the revocation endpoint and lists the refresh_token grant.
    [Fact]
    public async Task Discovery_names_the_revocation_endpoint_and_the_refresh_token_grant()
    {
        var discovery = await RelyingParty.JsonAsync(await factory.CreateHttpsClient().GetAsync("/.well-known/openid-configuration"));

        Assert.EndsWith("/connect/revoke", discovery.GetProperty("revocation_endpoint").GetString());
        Assert.Contains("refresh_token", discovery.GetProperty("grant_types_supported").EnumerateArray().Select(g => g.GetString()));
    }

    // Acceptance Test
    // Traces to: L2-109
    // Description: The chain's start stays inside ingresso: neither the access token nor the ID token carries it.
    [Fact]
    public async Task The_chain_start_never_reaches_the_app()
    {
        var app = await RelyingParty.RegisterWithOfflineAccessAsync(factory);
        var tokens = await app.SignInOfflineAsync();

        foreach (var name in new[] { "access_token", "id_token" })
        {
            var payload = new Microsoft.IdentityModel.JsonWebTokens.JsonWebToken(tokens.GetProperty(name).GetString()!);
            Assert.DoesNotContain(payload.Claims, c => c.Type == Ingresso.Api.Auth.IdentityProviderSetup.ChainStartedClaim);
        }
    }
}
