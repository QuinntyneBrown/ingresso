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
}
