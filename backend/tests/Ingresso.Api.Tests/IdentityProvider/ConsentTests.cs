using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using OpenIddict.Abstractions;
using Ingresso.Api.Tests.Infrastructure;
using static OpenIddict.Abstractions.OpenIddictConstants;

namespace Ingresso.Api.Tests.IdentityProvider;

/// <summary>L2-121 to L2-123 and L2-127: ingresso asks before an app gets more than sign-in, and remembers Allow.</summary>
public sealed class ConsentTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private async Task<HttpClient> SignedInBrowserAsync()
    {
        var browser = factory.CreateHttpsClient();
        await browser.SignInAsAsync(HttpClientExtensions.DevUser);
        return browser;
    }

    private static Dictionary<string, string?> Scope(string scope) => new() { ["scope"] = scope };

    private static async Task<HttpResponseMessage> AllowAsync(HttpClient browser, RelyingParty app, string scope) =>
        await browser.PostAsJsonAsync("/api/consent", new { clientId = app.ClientId, scope });

    // Acceptance Test
    // Traces to: L2-121
    // Description: An app that asks for profile is sent to the consent page with its authorize request, not back to the app.
    [Fact]
    public async Task An_app_asking_for_more_than_sign_in_goes_to_the_consent_page()
    {
        var app = await RelyingParty.RegisterAskingConsentAsync(factory);
        var browser = await SignedInBrowserAsync();

        var response = await browser.GetAsync(app.AuthorizePath(Scope("openid profile")));

        Assert.Equal(HttpStatusCode.Redirect, response.StatusCode);
        var location = response.Headers.Location!.OriginalString;
        Assert.StartsWith("/consent?", location);
        Assert.Contains($"client_id={app.ClientId}", location);
        Assert.Contains("scope=openid%20profile", location);
    }

    // Acceptance Test
    // Traces to: L2-121
    // Description: An app that asks for openid only signs in without a consent page.
    [Fact]
    public async Task Openid_alone_needs_no_consent()
    {
        var app = await RelyingParty.RegisterAskingConsentAsync(factory);
        var browser = await SignedInBrowserAsync();

        var response = await browser.GetAsync(app.AuthorizePath(Scope("openid")));

        Assert.True(RelyingParty.CallbackParameters(response).ContainsKey("code"));
    }

    // Acceptance Test
    // Traces to: L2-121, L2-122
    // Description: The consent page reads the app's name, the signed-in email and each scope in plain words, without openid.
    [Fact]
    public async Task The_consent_page_reads_what_to_ask_in_plain_words()
    {
        var (_, apiScope) = await RelyingParty.RegisterApiAsync(factory);
        var app = await RelyingParty.RegisterAskingConsentAsync(factory, offlineAccess: true, apiScope);
        var browser = await SignedInBrowserAsync();

        var response = await browser.GetAsync($"/api/consent?client_id={app.ClientId}&scope={Uri.EscapeDataString($"openid profile email {apiScope} offline_access")}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await RelyingParty.JsonAsync(response);
        Assert.StartsWith("Sample app ", body.GetProperty("appName").GetString());
        Assert.Equal(HttpClientExtensions.DevUser, body.GetProperty("email").GetString());
        var ask = body.GetProperty("ask").EnumerateArray().Select(s => (s.GetProperty("scope").GetString(), s.GetProperty("title").GetString())).ToList();
        var apiName = $"API {apiScope["api-".Length..^".read".Length]}";
        Assert.Equal(
            [("profile", "See your display name"), ("email", "See your email address"), (apiScope, $"Use {apiName} for you"),
             ("offline_access", "Stay signed in when you’re not using it")],
            ask);
        Assert.Empty(body.GetProperty("approved").EnumerateArray());
    }

    // Acceptance Test
    // Traces to: L2-123
    // Description: Allow records the approval; the authorize request then returns a code, and signing in again does not ask.
    [Fact]
    public async Task Allow_returns_to_the_app_and_is_remembered()
    {
        var app = await RelyingParty.RegisterAskingConsentAsync(factory);
        var browser = await SignedInBrowserAsync();

        Assert.Equal(HttpStatusCode.NoContent, (await AllowAsync(browser, app, "openid profile email")).StatusCode);
        var first = await browser.GetAsync(app.AuthorizePath(Scope("openid profile email")));
        var tokens = await app.ExchangeAsync(RelyingParty.CallbackParameters(first)["code"]);
        var again = await browser.GetAsync(app.AuthorizePath(Scope("openid profile")));

        Assert.Equal(HttpStatusCode.OK, tokens.StatusCode);
        Assert.Equal("openid profile email", (await RelyingParty.JsonAsync(tokens)).GetProperty("scope").GetString());
        Assert.True(RelyingParty.CallbackParameters(again).ContainsKey("code"));
    }

    // Acceptance Test
    // Traces to: L2-123
    // Description: Approving one app does not approve another that asks for the same scopes.
    [Fact]
    public async Task An_approval_is_for_one_app()
    {
        var approved = await RelyingParty.RegisterAskingConsentAsync(factory);
        var other = await RelyingParty.RegisterAskingConsentAsync(factory);
        var browser = await SignedInBrowserAsync();
        await AllowAsync(browser, approved, "openid profile");

        var response = await browser.GetAsync(other.AuthorizePath(Scope("openid profile")));

        Assert.StartsWith("/consent?", response.Headers.Location!.OriginalString);
    }

    // Acceptance Test
    // Traces to: L2-123
    // Description: The tokens issued after Allow belong to the permanent approval, so revoking it can revoke them.
    [Fact]
    public async Task Tokens_belong_to_the_approval()
    {
        var app = await RelyingParty.RegisterAskingConsentAsync(factory);
        var browser = await SignedInBrowserAsync();
        await AllowAsync(browser, app, "openid email");
        var authorized = await browser.GetAsync(app.AuthorizePath(Scope("openid email")));
        (await app.ExchangeAsync(RelyingParty.CallbackParameters(authorized)["code"])).EnsureSuccessStatusCode();

        using var scope = factory.Services.CreateScope();
        var applications = scope.ServiceProvider.GetRequiredService<IOpenIddictApplicationManager>();
        var authorizations = scope.ServiceProvider.GetRequiredService<IOpenIddictAuthorizationManager>();
        var tokens = scope.ServiceProvider.GetRequiredService<IOpenIddictTokenManager>();
        var appId = await applications.GetIdAsync((await applications.FindByClientIdAsync(app.ClientId))!);
        var approvals = new List<object>();
        await foreach (var authorization in authorizations.FindByApplicationIdAsync(appId!))
        {
            approvals.Add(authorization);
        }

        var approval = Assert.Single(approvals);
        Assert.Equal(AuthorizationTypes.Permanent, await authorizations.GetTypeAsync(approval));
        var issued = 0;
        await foreach (var _ in tokens.FindByAuthorizationIdAsync((await authorizations.GetIdAsync(approval))!))
        {
            issued++;
        }

        Assert.True(issued > 0);
    }

    // Acceptance Test
    // Traces to: L2-127
    // Description: Recording an approval without the anti-forgery header is refused, and nothing is recorded.
    [Fact]
    public async Task Allow_needs_the_anti_forgery_token()
    {
        var app = await RelyingParty.RegisterAskingConsentAsync(factory);
        var browser = await SignedInBrowserAsync();
        browser.DefaultRequestHeaders.Remove("X-XSRF-TOKEN");

        var response = await AllowAsync(browser, app, "openid profile");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.StartsWith("/consent?", (await (await SignedInBrowserAsync()).GetAsync(app.AuthorizePath(Scope("openid profile")))).Headers.Location!.OriginalString);
    }

    // Acceptance Test
    // Traces to: L2-127
    // Description: Without a session, recording an approval and reading the consent page are refused with 401.
    [Fact]
    public async Task Consent_needs_a_session()
    {
        var app = await RelyingParty.RegisterAskingConsentAsync(factory);
        var anonymous = factory.CreateHttpsClient();

        Assert.Equal(HttpStatusCode.Unauthorized, (await AllowAsync(anonymous, app, "openid profile")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.GetAsync($"/api/consent?client_id={app.ClientId}&scope=openid")).StatusCode);
    }

    // Acceptance Test
    // Traces to: L2-127
    // Description: An approval for a scope the app may not ask for is refused, and nothing is recorded.
    [Fact]
    public async Task Allow_refuses_scopes_the_app_may_not_ask_for()
    {
        var (_, apiScope) = await RelyingParty.RegisterApiAsync(factory);
        var app = await RelyingParty.RegisterAskingConsentAsync(factory);
        var browser = await SignedInBrowserAsync();

        var response = await AllowAsync(browser, app, $"openid {apiScope}");
        var offline = await AllowAsync(browser, app, "openid offline_access");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, offline.StatusCode);
        var page = await RelyingParty.JsonAsync(await browser.GetAsync($"/api/consent?client_id={app.ClientId}&scope=openid%20profile"));
        Assert.Empty(page.GetProperty("approved").EnumerateArray());
    }

    // Acceptance Test
    // Traces to: L2-121
    // Description: The consent page for an app ingresso doesn't know answers 404.
    [Fact]
    public async Task An_unknown_app_has_no_consent_page()
    {
        var browser = await SignedInBrowserAsync();

        var response = await browser.GetAsync("/api/consent?client_id=no-such-app&scope=openid%20profile");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    // Acceptance Test
    // Traces to: L2-124
    // Description: Deny returns to the app's redirect address with access_denied and its state, and issues no code.
    [Fact]
    public async Task Deny_tells_the_app_no()
    {
        var app = await RelyingParty.RegisterAskingConsentAsync(factory);
        var browser = await SignedInBrowserAsync();

        var response = await browser.GetAsync(app.AuthorizePath(new Dictionary<string, string?> { ["scope"] = "openid profile", ["consent"] = "deny" }));

        Assert.StartsWith(RelyingParty.RedirectUri, response.Headers.Location!.AbsoluteUri);
        var callback = RelyingParty.CallbackParameters(response);
        Assert.Equal("access_denied", callback["error"]);
        Assert.Equal(app.State, callback["state"]);
        Assert.False(callback.ContainsKey("code"));
    }

    // Acceptance Test
    // Traces to: L2-124
    // Description: A denial records nothing, so the next request asks again.
    [Fact]
    public async Task A_denial_asks_again_next_time()
    {
        var app = await RelyingParty.RegisterAskingConsentAsync(factory);
        var browser = await SignedInBrowserAsync();
        await browser.GetAsync(app.AuthorizePath(new Dictionary<string, string?> { ["scope"] = "openid profile", ["consent"] = "deny" }));

        var again = await browser.GetAsync(app.AuthorizePath(Scope("openid profile")));

        Assert.StartsWith("/consent?", again.Headers.Location!.OriginalString);
    }
}
