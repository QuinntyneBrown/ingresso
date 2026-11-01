using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Ingresso.Api.Tests.Infrastructure;

namespace Ingresso.Api.Tests.IdentityProvider;

/// <summary>L2-092 to L2-094: authorization requests from registered apps, and the token endpoint.</summary>
public sealed class AuthorizationTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private async Task<HttpClient> SignedInClient(string email = HttpClientExtensions.DevUser)
    {
        var client = factory.CreateHttpsClient();
        await client.SignInAsAsync(email);
        return client;
    }

    private async Task<string> CodeFor(RelyingParty app)
    {
        var response = await (await SignedInClient()).GetAsync(app.AuthorizePath());
        return RelyingParty.CallbackParameters(response)["code"];
    }

    // Acceptance Test
    // Traces to: L2-092
    // Description: With a session, the authorization request returns straight to the app's address with a code and its state.
    [Fact]
    public async Task With_a_session_the_browser_returns_to_the_app_with_a_code_and_its_state()
    {
        var app = await RelyingParty.RegisterAsync(factory);

        var response = await (await SignedInClient()).GetAsync(app.AuthorizePath());

        Assert.Equal(HttpStatusCode.Redirect, response.StatusCode);
        Assert.StartsWith(RelyingParty.RedirectUri + "?", response.Headers.Location!.ToString());
        var parameters = RelyingParty.CallbackParameters(response);
        Assert.False(string.IsNullOrEmpty(parameters["code"]));
        Assert.Equal(app.State, parameters["state"]);
    }

    // Acceptance Test
    // Traces to: L2-092
    // Description: The code and its verifier get an ID token signed by a published key, for the app, naming the person and echoing the nonce.
    [Fact]
    public async Task The_code_and_verifier_get_a_signed_id_token_for_the_person()
    {
        var app = await RelyingParty.RegisterAsync(factory);
        var code = await CodeFor(app);

        var response = await app.ExchangeAsync(code);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var idToken = await app.ValidateIdTokenAsync((await RelyingParty.JsonAsync(response)).GetProperty("id_token").GetString()!);
        var userId = await factory.WithDbAsync(db => db.Users.Where(u => u.Email == HttpClientExtensions.DevUser).Select(u => u.Id).SingleAsync());
        Assert.Equal(userId.ToString(), idToken.Subject);
        Assert.Equal(HttpClientExtensions.DevUser, idToken.GetClaim("email").Value);
        Assert.Equal(app.Nonce, idToken.GetClaim("nonce").Value);
    }

    // Acceptance Test
    // Traces to: L2-092
    // Description: A code works once.
    [Fact]
    public async Task A_code_already_exchanged_is_refused()
    {
        var app = await RelyingParty.RegisterAsync(factory);
        var code = await CodeFor(app);
        await app.ExchangeAsync(code);

        var again = await app.ExchangeAsync(code);

        Assert.Equal(HttpStatusCode.BadRequest, again.StatusCode);
        Assert.Equal("invalid_grant", (await RelyingParty.JsonAsync(again)).GetProperty("error").GetString());
    }

    // Acceptance Test
    // Traces to: L2-092
    // Description: A wrong PKCE verifier is refused and no tokens are issued.
    [Fact]
    public async Task A_wrong_verifier_is_refused()
    {
        var app = await RelyingParty.RegisterAsync(factory);
        var code = await CodeFor(app);

        var response = await app.ExchangeAsync(code, verifier: new string('x', 43));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var json = await RelyingParty.JsonAsync(response);
        Assert.Equal("invalid_grant", json.GetProperty("error").GetString());
        Assert.False(json.TryGetProperty("id_token", out _));
    }

    // Acceptance Test
    // Traces to: L2-092
    // Description: A request without a code challenge, or with the plain method, gets no code and is not redirected to the app.
    [Theory]
    [InlineData(null)]
    [InlineData("plain")]
    public async Task Without_an_s256_challenge_no_code_is_issued(string? method)
    {
        var app = await RelyingParty.RegisterAsync(factory);
        var overrides = method is null
            ? new Dictionary<string, string?> { ["code_challenge"] = null, ["code_challenge_method"] = null }
            : new Dictionary<string, string?> { ["code_challenge"] = app.Verifier, ["code_challenge_method"] = method };

        var response = await (await SignedInClient()).GetAsync(app.AuthorizePath(overrides));

        // OpenIddict rejects the request before it has validated the redirect address, so it does not redirect at all.
        Assert.Equal(HttpStatusCode.Redirect, response.StatusCode);
        Assert.Equal("/authorize-error", response.Headers.Location!.OriginalString);
    }

    // Acceptance Test
    // Traces to: L2-093
    // Description: Without a session, the browser goes to sign-in with the authorization request as its return address.
    [Fact]
    public async Task Without_a_session_the_browser_goes_to_sign_in_with_the_request_as_return_address()
    {
        var app = await RelyingParty.RegisterAsync(factory);
        var path = app.AuthorizePath();

        var response = await factory.CreateHttpsClient().GetAsync(path);

        Assert.Equal(HttpStatusCode.Redirect, response.StatusCode);
        Assert.Equal("/sign-in?returnUrl=" + Uri.EscapeDataString(path), response.Headers.Location!.OriginalString);
    }

    // Acceptance Test
    // Traces to: L2-093
    // Description: A signed-in person whose email is not verified gets no code and goes to verify it.
    [Fact]
    public async Task An_unverified_person_gets_no_code_and_goes_to_verify_their_email()
    {
        var app = await RelyingParty.RegisterAsync(factory);
        var client = factory.CreateHttpsClient();
        (await client.PostAsJsonAsync("/api/test/sign-in", new { email = $"new-{Guid.NewGuid():N}@example.com", createUnverified = true }))
            .EnsureSuccessStatusCode();

        var response = await client.GetAsync(app.AuthorizePath());

        Assert.Equal(HttpStatusCode.Redirect, response.StatusCode);
        Assert.Equal("/verify-email", response.Headers.Location!.OriginalString);
    }

    // Acceptance Test
    // Traces to: L2-094
    // Description: An unknown client, or a redirect address not registered exactly, never redirects to it and shows the authorize error page.
    [Theory]
    [InlineData("client_id", "unknown-client")]
    [InlineData("redirect_uri", "https://evil.example.com/signin-oidc")]
    [InlineData("redirect_uri", "https://app.example.com/signin-oidc/extra")]
    public async Task An_untrusted_request_goes_to_the_authorize_error_page(string parameter, string value)
    {
        var app = await RelyingParty.RegisterAsync(factory);

        var response = await (await SignedInClient()).GetAsync(app.AuthorizePath(new Dictionary<string, string?> { [parameter] = value }));

        Assert.Equal(HttpStatusCode.Redirect, response.StatusCode);
        Assert.Equal("/authorize-error", response.Headers.Location!.OriginalString);
    }
}
