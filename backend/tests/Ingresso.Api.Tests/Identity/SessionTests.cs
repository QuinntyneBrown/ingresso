using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Ingresso.Api.Tests.Infrastructure;

namespace Ingresso.Api.Tests.Identity;

/// <summary>L2-048 and L2-050: sessions are server-side, expire after 14 idle days and can be revoked.</summary>
public sealed class SessionTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    [Fact]
    public async Task Me_describes_the_signed_in_user_for_the_header()
    {
        var client = factory.CreateHttpsClient();
        await client.SignInAsAsync(HttpClientExtensions.DevUser);

        var me = await client.GetFromJsonAsync<JsonElement>("/api/auth/me");

        Assert.Equal("member", me.GetProperty("role").GetString());
        Assert.False(string.IsNullOrEmpty(me.GetProperty("displayName").GetString()));
        Assert.False(string.IsNullOrEmpty(me.GetProperty("initials").GetString()));
    }

    // Acceptance Test
    // Traces to: L2-030
    // Description: A session the server has removed is treated as anonymous.
    [Fact]
    public async Task A_revoked_session_is_anonymous()
    {
        var client = factory.CreateHttpsClient();
        await client.SignInAsAsync(HttpClientExtensions.DevUser);
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/auth/me")).StatusCode);
        await factory.WithDbAsync(async db =>
        {
            foreach (var s in await db.Sessions.ToListAsync()) s.RevokedAtUtc = ApiFactory.Today;
            return await db.SaveChangesAsync();
        });

        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/auth/me")).StatusCode);
    }

    // Acceptance Test
    // Traces to: L2-030
    // Description: A session idle for 14 days is rejected.
    [Fact]
    public async Task A_session_idle_for_14_days_has_expired()
    {
        var client = factory.CreateHttpsClient();
        await client.SignInAsAsync(HttpClientExtensions.DevUser);
        await factory.WithDbAsync(async db =>
        {
            foreach (var s in await db.Sessions.Where(s => s.RevokedAtUtc == null).ToListAsync()) s.LastSeenAtUtc = ApiFactory.Today.AddDays(-14).AddMinutes(-1);
            return await db.SaveChangesAsync();
        });

        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/auth/me")).StatusCode);
    }

    [Fact]
    public async Task Each_sign_in_is_its_own_session()
    {
        var phone = factory.CreateHttpsClient();
        var laptop = factory.CreateHttpsClient();
        await phone.SignInAsAsync(HttpClientExtensions.DevUser);
        await laptop.SignInAsAsync(HttpClientExtensions.DevUser);

        var sessions = await factory.WithDbAsync(db => db.Sessions.CountAsync(s => s.User!.Email == HttpClientExtensions.DevUser && s.RevokedAtUtc == null));

        Assert.True(sessions >= 2);
    }

    // Acceptance Test
    // Traces to: L2-031, L2-101
    // Description: Signing out deletes the server session, clears the cookie and leaves the client anonymous; with no app to notify there is no signed-out ticket.
    [Fact]
    public async Task Sign_out_revokes_the_session_and_clears_the_cookie()
    {
        var client = factory.CreateHttpsClient();
        await client.SignInAsAsync(HttpClientExtensions.DevUser);
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/auth/me")).StatusCode);
        var active = await factory.WithDbAsync(db => db.Sessions.CountAsync(s => s.RevokedAtUtc == null));

        var response = await client.PostAsync("/api/auth/sign-out", null);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(System.Text.Json.JsonValueKind.Null, (await Ingresso.Api.Tests.IdentityProvider.RelyingParty.JsonAsync(response)).GetProperty("signedOut").ValueKind);
        Assert.Contains(response.Headers.GetValues("Set-Cookie"), c => c.StartsWith(Ingresso.Api.Auth.AuthPolicies.SessionCookie + "=;", StringComparison.Ordinal));
        Assert.Equal(active - 1, await factory.WithDbAsync(db => db.Sessions.CountAsync(s => s.RevokedAtUtc == null)));
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/auth/me")).StatusCode);
    }

    // Acceptance Test
    // Traces to: L2-031
    // Description: Replaying a signed-out session id is refused with 401.
    [Fact]
    public async Task A_signed_out_session_id_is_refused_when_replayed()
    {
        var client = factory.CreateHttpsClient();
        var signIn = await client.PostAsJsonAsync("/api/test/sign-in", new { email = HttpClientExtensions.DevUser });
        var cookies = signIn.Headers.GetValues("Set-Cookie").Select(c => c.Split(';')[0]).ToList();
        var session = cookies.Single(c => c.StartsWith(Ingresso.Api.Auth.AuthPolicies.SessionCookie + "=", StringComparison.Ordinal));
        var xsrf = cookies.Single(c => c.StartsWith("XSRF-TOKEN=", StringComparison.Ordinal))["XSRF-TOKEN=".Length..];
        client.DefaultRequestHeaders.Add("X-XSRF-TOKEN", Uri.UnescapeDataString(xsrf));
        await client.PostAsync("/api/auth/sign-out", null);

        var replay = factory.CreateHttpsClient();
        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/auth/me");
        request.Headers.Add("Cookie", session);
        var response = await replay.SendAsync(request);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // Acceptance Test
    // Traces to: L2-027
    // Description: Where the test seam is enabled, opening one URL signs in the seeded user and lands on the dashboard.
    [Fact]
    public async Task Opening_the_dev_sign_in_url_signs_in_the_seeded_user()
    {
        var client = factory.CreateHttpsClient();

        var response = await client.GetAsync("/api/test/sign-in");
        var me = await client.GetAsync("/api/auth/me");

        Assert.Equal(HttpStatusCode.Redirect, response.StatusCode);
        Assert.Equal("/", response.Headers.Location?.OriginalString);
        Assert.Equal(HttpStatusCode.OK, me.StatusCode);
    }
}
