using System.Net;
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
}
