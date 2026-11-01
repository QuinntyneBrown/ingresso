using System.Net;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Ingresso.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;
using Ingresso.Api.Tests.Infrastructure;

namespace Ingresso.Api.Tests.IdentityProvider;

/// <summary>L2-099 to L2-102: apps recorded against a session, app-started and ingresso sign-out, and untrusted requests.</summary>
public sealed class SignOutEverywhereTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    // Acceptance Test
    // Traces to: L2-099
    // Description: An app that signs in under a session is recorded against it once, and its ID token carries the session's id as sid.
    [Fact]
    public async Task An_app_signing_in_is_recorded_against_the_session_and_its_id_token_carries_sid()
    {
        var app = await RelyingParty.RegisterAsync(factory);
        var browser = factory.CreateHttpsClient();
        await browser.SignInAsAsync(HttpClientExtensions.DevUser);

        await browser.GetAsync(app.AuthorizePath());
        var second = await browser.GetAsync(app.AuthorizePath());
        var tokens = await RelyingParty.JsonAsync(await app.ExchangeAsync(RelyingParty.CallbackParameters(second)["code"]));
        var idToken = await app.ValidateIdTokenAsync(tokens.GetProperty("id_token").GetString()!);

        var recorded = await factory.WithDbAsync(db => db.SessionApps.Where(a => a.ClientId == app.ClientId).ToListAsync());
        var sessionApp = Assert.Single(recorded);
        Assert.Equal(sessionApp.SessionId.ToString(), idToken.GetClaim("sid").Value);
    }

    // Acceptance Test
    // Traces to: L2-101
    // Description: Signing out of ingresso returns a ticket for the signed-out page, naming each app with its front-channel address, iss and sid.
    [Fact]
    public async Task Signing_out_of_ingresso_names_each_app_to_notify()
    {
        var app = await RelyingParty.RegisterForSignOutAsync(factory);
        var browser = await SignedInBrowser();
        await app.SignInAsync(browser);
        var sid = await SessionIdOf(app);

        var response = await browser.PostAsync("/api/auth/sign-out", null);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var signedOut = await SignedOutAsync((await RelyingParty.JsonAsync(response)).GetProperty("signedOut").GetString()!);
        var notified = Assert.Single(signedOut.GetProperty("apps").EnumerateArray());
        Assert.StartsWith("Sample app", notified.GetProperty("name").GetString());
        Assert.Equal(
            $"{RelyingParty.FrontChannelLogoutUri}?iss={Uri.EscapeDataString("https://ingresso.dev/")}&sid={sid}",
            notified.GetProperty("logoutUri").GetString());
        Assert.Equal(JsonValueKind.Null, signedOut.GetProperty("returnUrl").ValueKind);
        Assert.Equal(HttpStatusCode.Unauthorized, (await browser.GetAsync("/api/auth/me")).StatusCode);
    }

    // Acceptance Test
    // Traces to: L2-101
    // Description: A signed-out ticket that cannot be read, or is more than 10 minutes old, finds nothing.
    [Fact]
    public async Task An_unreadable_or_old_signed_out_ticket_finds_nothing()
    {
        using var clocked = new MovableClockFactory();
        var app = await RelyingParty.RegisterForSignOutAsync(clocked);
        var browser = clocked.CreateHttpsClient();
        await browser.SignInAsAsync(HttpClientExtensions.DevUser);
        await app.SignInAsync(browser);
        var ticket = (await RelyingParty.JsonAsync(await browser.PostAsync("/api/auth/sign-out", null))).GetProperty("signedOut").GetString()!;
        var anonymous = clocked.CreateHttpsClient();

        Assert.Equal(HttpStatusCode.NotFound, (await anonymous.GetAsync("/api/auth/signed-out?ticket=not-a-ticket")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await anonymous.GetAsync($"/api/auth/signed-out?ticket={Uri.EscapeDataString(ticket)}")).StatusCode);
        clocked.Clock.Advance(TimeSpan.FromMinutes(11));
        Assert.Equal(HttpStatusCode.NotFound, (await anonymous.GetAsync($"/api/auth/signed-out?ticket={Uri.EscapeDataString(ticket)}")).StatusCode);
    }

    // Acceptance Test
    // Traces to: L2-100
    // Description: An app's end-session request with its ID token and registered return address ends the session, then the signed-out page notifies the apps and continues to the return address with state.
    [Fact]
    public async Task An_apps_end_session_request_ends_the_session_and_continues_to_the_app()
    {
        var app = await RelyingParty.RegisterForSignOutAsync(factory);
        var browser = await SignedInBrowser();
        var idToken = await app.SignInAsync(browser);

        var response = await browser.GetAsync(RelyingParty.EndSessionPath(idToken));

        Assert.Equal(HttpStatusCode.Redirect, response.StatusCode);
        var location = response.Headers.Location!.OriginalString;
        Assert.StartsWith("/signed-out?ticket=", location);
        var signedOut = await SignedOutAsync(Uri.UnescapeDataString(location["/signed-out?ticket=".Length..]));
        Assert.Single(signedOut.GetProperty("apps").EnumerateArray());
        Assert.Equal(RelyingParty.SignOutReturnUri + "?state=bye", signedOut.GetProperty("returnUrl").GetString());
        Assert.Equal(HttpStatusCode.Unauthorized, (await browser.GetAsync("/api/auth/me")).StatusCode);
    }

    // Acceptance Test
    // Traces to: L2-100
    // Description: With no session, a valid end-session request goes straight back to the app's return address.
    [Fact]
    public async Task Without_a_session_an_end_session_request_goes_straight_back_to_the_app()
    {
        var app = await RelyingParty.RegisterForSignOutAsync(factory);
        var idToken = await app.SignInAsync(await SignedInBrowser());

        var response = await factory.CreateHttpsClient().GetAsync(RelyingParty.EndSessionPath(idToken));

        Assert.Equal(HttpStatusCode.Redirect, response.StatusCode);
        Assert.Equal(RelyingParty.SignOutReturnUri + "?state=bye", response.Headers.Location!.OriginalString);
    }

    // Acceptance Test
    // Traces to: L2-102
    // Description: An end-session request without an ID token hint, or with an unregistered return address, keeps the session and shows the error page.
    [Theory]
    [InlineData("no hint")]
    [InlineData("unregistered return address")]
    public async Task An_untrusted_end_session_request_keeps_the_session_and_shows_the_error_page(string problem)
    {
        var app = await RelyingParty.RegisterForSignOutAsync(factory);
        var browser = await SignedInBrowser();
        var idToken = await app.SignInAsync(browser);
        var path = problem == "no hint"
            ? RelyingParty.EndSessionPath(null)
            : RelyingParty.EndSessionPath(idToken, "https://evil.example.com/signout-callback-oidc");

        var response = await browser.GetAsync(path);

        Assert.Equal(HttpStatusCode.Redirect, response.StatusCode);
        Assert.Equal("/authorize-error?flow=sign-out", response.Headers.Location!.OriginalString);
        Assert.Equal(HttpStatusCode.OK, (await browser.GetAsync("/api/auth/me")).StatusCode);
    }

    private async Task<HttpClient> SignedInBrowser()
    {
        var browser = factory.CreateHttpsClient();
        await browser.SignInAsAsync(HttpClientExtensions.DevUser);
        return browser;
    }

    private Task<Guid> SessionIdOf(RelyingParty app) =>
        factory.WithDbAsync(db => db.SessionApps.Where(a => a.ClientId == app.ClientId).Select(a => a.SessionId).SingleAsync());

    private async Task<JsonElement> SignedOutAsync(string ticket)
    {
        var response = await factory.CreateHttpsClient().GetAsync($"/api/auth/signed-out?ticket={Uri.EscapeDataString(ticket)}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return await RelyingParty.JsonAsync(response);
    }

    /// <summary>The API with a clock the test can move forward.</summary>
    private sealed class MovableClockFactory : ApiFactory
    {
        public MovableClock Clock { get; } = new(Today);

        protected override void ConfigureTestServices(IServiceCollection services)
        {
            services.RemoveAll<IClock>();
            services.AddSingleton<IClock>(Clock);
        }
    }

    private sealed class MovableClock(DateTimeOffset now) : IClock
    {
        public DateTimeOffset UtcNow { get; private set; } = now;

        public void Advance(TimeSpan by) => UtcNow += by;
    }
}
