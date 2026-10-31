using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Ingresso.Api.Tests.Infrastructure;
using Ingresso.Domain.Enums;
using Ingresso.Infrastructure.Email;
using Ingresso.Infrastructure.Outbox;

namespace Ingresso.Api.Tests.Identity;

/// <summary>L2-046, L2-047, L2-084: request and redeem a magic sign-in link.</summary>
public sealed class SignInLinkTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private static string NewEmail() => $"user-{Guid.NewGuid():N}@example.com";

    private async Task<HttpResponseMessage> Redeem(HttpClient client, string token) =>
        await client.GetAsync($"/auth/redeem?token={Uri.EscapeDataString(token)}");

    [Fact]
    public async Task Requesting_a_link_answers_202_and_emails_a_link_that_works_for_15_minutes()
    {
        var email = NewEmail();

        var response = await factory.RequestLink(email);
        var token = await factory.LatestToken(email);

        Assert.Equal(HttpStatusCode.Accepted, response.StatusCode);
        Assert.Equal(string.Empty, await response.Content.ReadAsStringAsync());
        Assert.True(token.Length >= 43, "at least 256 bits, Base64Url");
        var mail = factory.Services.GetRequiredService<DevMailbox>().For(email).Last().Message;
        Assert.Contains($"https://ingresso.dev/auth/redeem?token={token}", mail.TextBody);
        Assert.Contains("expires in 15 minutes", mail.TextBody);
        var stored = await factory.WithDbAsync(db => db.SecurityTokens.AsNoTracking().SingleAsync(t => t.Email == email));
        Assert.Equal(SecurityTokenPurpose.SignIn, stored.Purpose);
        Assert.Equal(ApiFactory.Today.AddMinutes(15), stored.ExpiresAtUtc);
        Assert.NotEqual(token, stored.TokenHash);
        Assert.DoesNotContain(token, stored.TokenHash);
    }

    [Fact]
    public async Task Known_and_unknown_addresses_get_the_same_answer()
    {
        var known = await factory.RequestLink(HttpClientExtensions.DevUser);
        var unknown = await factory.RequestLink(NewEmail());

        Assert.Equal(known.StatusCode, unknown.StatusCode);
        Assert.Equal(await known.Content.ReadAsStringAsync(), await unknown.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task Malformed_email_and_external_return_urls_are_refused()
    {
        var bad = await factory.RequestLink("priya@gtaazure");
        var external = await factory.RequestLink(NewEmail(), "//evil.example.com/organize");

        Assert.Equal(HttpStatusCode.BadRequest, bad.StatusCode);
        var errors = (await bad.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");
        Assert.Equal("Enter an email address like name@example.com.", errors.GetProperty("email")[0].GetString());
        Assert.Equal(HttpStatusCode.BadRequest, external.StatusCode);
    }

    [Fact]
    public async Task Redeeming_a_new_address_creates_a_member_starts_a_session_and_opens_home()
    {
        var email = NewEmail();
        await factory.RequestLink(email);
        var client = factory.CreateHttpsClient();

        var response = await Redeem(client, await factory.LatestToken(email));

        Assert.Equal(HttpStatusCode.Redirect, response.StatusCode);
        Assert.Equal("/", response.Headers.Location?.OriginalString);
        var me = await client.GetFromJsonAsync<JsonElement>("/api/auth/me");
        Assert.Equal("member", me.GetProperty("role").GetString());
        Assert.Equal(0, me.GetProperty("unreadNotificationCount").GetInt32());
        var user = await factory.WithDbAsync(db => db.Users.AsNoTracking().SingleAsync(u => u.Email == email));
        Assert.Equal(UserRole.Member, user.Role);
    }

    [Fact]
    public async Task A_return_url_wins_over_home()
    {
        await factory.RequestLink(HttpClientExtensions.DevUser, "/settings");
        var response = await Redeem(factory.CreateHttpsClient(), await factory.LatestToken(HttpClientExtensions.DevUser));

        Assert.Equal("/settings", response.Headers.Location?.OriginalString);
    }

    [Fact]
    public async Task A_used_link_is_refused_and_starts_no_session()
    {
        var email = NewEmail();
        await factory.RequestLink(email);
        var token = await factory.LatestToken(email);
        await Redeem(factory.CreateHttpsClient(), token);
        var second = factory.CreateHttpsClient();

        var response = await Redeem(second, token);

        Assert.Equal("/sign-in?link=expired", response.Headers.Location?.OriginalString);
        Assert.Equal(HttpStatusCode.Unauthorized, (await second.GetAsync("/api/auth/me")).StatusCode);
    }

    [Fact]
    public async Task A_link_past_15_minutes_is_refused()
    {
        var email = NewEmail();
        await factory.RequestLink(email);
        var token = await factory.LatestToken(email);
        await factory.WithDbAsync(async db =>
        {
            var stored = await db.SecurityTokens.SingleAsync(t => t.Email == email);
            stored.CreatedAtUtc = ApiFactory.Today.AddMinutes(-16);
            stored.ExpiresAtUtc = ApiFactory.Today.AddMinutes(-1);
            return await db.SaveChangesAsync();
        });

        var response = await Redeem(factory.CreateHttpsClient(), token);

        Assert.Equal("/sign-in?link=expired", response.Headers.Location?.OriginalString);
    }

    [Fact]
    public async Task Me_is_401_when_anonymous()
    {
        Assert.Equal(HttpStatusCode.Unauthorized, (await factory.CreateHttpsClient().GetAsync("/api/auth/me")).StatusCode);
    }
}
