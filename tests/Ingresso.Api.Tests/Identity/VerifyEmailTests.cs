using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Ingresso.Api.Tests.Infrastructure;
using Ingresso.Domain.Entities;
using Ingresso.Domain.Enums;
using Ingresso.Infrastructure.Email;
using Ingresso.Infrastructure.Outbox;

namespace Ingresso.Api.Tests.Identity;

/// <summary>L2-029: an account's email is verified on first sign-in, and an unverified account cannot use tiles.</summary>
public sealed class VerifyEmailTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private static string NewEmail() => $"verify-{Guid.NewGuid():N}@example.com";

    // Acceptance Test
    // Traces to: L2-029
    // Description: Redeeming a sign-in link for a first-time email marks that email verified.
    [Fact]
    public async Task Redeeming_a_first_sign_in_link_marks_the_email_verified()
    {
        var email = NewEmail();
        await factory.RequestLink(email);
        var token = await factory.LatestToken(email);

        var response = await factory.CreateHttpsClient().RedeemAsync(token);

        Assert.Equal(HttpStatusCode.Redirect, response.StatusCode);
        var verified = await factory.WithDbAsync(db => db.VerifiedEmails.AnyAsync(v => v.NormalizedEmail == email));
        Assert.True(verified);
    }

    /// <summary>An account that exists but whose address has never been verified.</summary>
    private async Task<HttpClient> SignedInUnverified()
    {
        var email = NewEmail();
        await factory.WithDbAsync(async db =>
        {
            db.Users.Add(new User { Email = email, Role = UserRole.Member, CreatedAtUtc = ApiFactory.Today });
            return await db.SaveChangesAsync();
        });
        var client = factory.CreateHttpsClient();
        await client.SignInAsAsync(email);
        return client;
    }

    // Acceptance Test
    // Traces to: L2-029
    // Description: An unverified account is refused by every tile endpoint with 403.
    [Fact]
    public async Task An_unverified_account_gets_403_from_the_tile_endpoints()
    {
        var client = await SignedInUnverified();

        Assert.Equal(HttpStatusCode.Forbidden, (await client.GetAsync("/api/tiles")).StatusCode);
        var body = new { name = "Mail", url = "https://mail.example.com", color = "#CF3B20" };
        Assert.Equal(HttpStatusCode.Forbidden, (await client.PostAsJsonAsync("/api/tiles", body)).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await client.PostAsync("/api/tiles/reset-layout", null)).StatusCode);
    }

    // Acceptance Test
    // Traces to: L2-029
    // Description: The signed-in user's details say whether the address is verified, and are still available when it is not.
    [Fact]
    public async Task Me_says_whether_the_email_is_verified()
    {
        var unverified = await SignedInUnverified();
        var verified = factory.CreateHttpsClient();
        await verified.SignInAsAsync(HttpClientExtensions.DevUser);

        var before = await unverified.GetFromJsonAsync<JsonElement>("/api/auth/me");
        var seeded = await verified.GetFromJsonAsync<JsonElement>("/api/auth/me");

        Assert.False(before.GetProperty("emailVerified").GetBoolean());
        Assert.True(seeded.GetProperty("emailVerified").GetBoolean());
        Assert.Equal(HttpStatusCode.OK, (await verified.GetAsync("/api/tiles")).StatusCode);
    }

    private async Task<string> VerificationLink(ApiFactory from, string email)
    {
        using (var scope = from.Services.CreateScope())
        {
            await scope.ServiceProvider.GetRequiredService<OutboxDispatcher>().ProcessDueAsync(CancellationToken.None);
        }

        var body = from.Services.GetRequiredService<DevMailbox>().For(email).Last(m => m.Message.Subject == "Verify your email").Message.TextBody;
        var start = body.IndexOf("/auth/verify-email?token=", StringComparison.Ordinal);
        return new string(body[start..].TakeWhile(c => !char.IsWhiteSpace(c)).ToArray());
    }

    private static async Task<string> EmailOf(HttpClient client) =>
        (await client.GetFromJsonAsync<JsonElement>("/api/auth/me")).GetProperty("email").GetString()!;

    // Acceptance Test
    // Traces to: L2-029
    // Description: An unverified account can ask for another verification email, and following its link verifies the account.
    [Fact]
    public async Task An_unverified_account_can_request_another_email_and_following_it_verifies()
    {
        var client = await SignedInUnverified();
        var email = await EmailOf(client);

        var response = await client.PostAsync("/api/auth/verification-emails", null);
        var link = await VerificationLink(factory, email);
        var opened = await client.GetAsync(link);

        Assert.Equal(HttpStatusCode.Accepted, response.StatusCode);
        Assert.Equal(HttpStatusCode.Redirect, opened.StatusCode);
        Assert.Equal("/?email-verified=1", opened.Headers.Location?.OriginalString);
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/tiles")).StatusCode);
        Assert.True((await client.GetFromJsonAsync<JsonElement>("/api/auth/me")).GetProperty("emailVerified").GetBoolean());
    }

    // Acceptance Test
    // Traces to: L2-029
    // Description: A verified account asking again is answered the same way but no email is sent.
    [Fact]
    public async Task A_verified_account_is_not_sent_another_email()
    {
        var client = factory.CreateHttpsClient();
        await client.SignInAsAsync(HttpClientExtensions.DevUser);
        var before = factory.Services.GetRequiredService<DevMailbox>().For(HttpClientExtensions.DevUser).Count();

        var response = await client.PostAsync("/api/auth/verification-emails", null);

        Assert.Equal(HttpStatusCode.Accepted, response.StatusCode);
        Assert.Equal(before, factory.Services.GetRequiredService<DevMailbox>().For(HttpClientExtensions.DevUser).Count());
    }

    // Acceptance Test
    // Traces to: L2-029
    // Description: Asking without a session is refused with 401.
    [Fact]
    public async Task Asking_for_a_verification_email_needs_a_session()
    {
        var response = await factory.CreateHttpsClient().PostAsync("/api/auth/verification-emails", null);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // Acceptance Test
    // Traces to: L2-029
    // Description: Verification emails are rate limited per account, and the answer says when to try again.
    [Fact]
    public async Task Verification_emails_are_rate_limited()
    {
        using var small = new TwoPerHourFactory();
        var email = NewEmail();
        await small.WithDbAsync(async db =>
        {
            db.Users.Add(new User { Email = email, Role = UserRole.Member, CreatedAtUtc = ApiFactory.Today });
            return await db.SaveChangesAsync();
        });
        var client = small.CreateHttpsClient();
        await client.SignInAsAsync(email);

        var statuses = new List<HttpStatusCode>();
        HttpResponseMessage last = null!;
        for (var i = 0; i < 3; i++)
        {
            last = await client.PostAsync("/api/auth/verification-emails", null);
            statuses.Add(last.StatusCode);
        }

        Assert.Equal([HttpStatusCode.Accepted, HttpStatusCode.Accepted, HttpStatusCode.TooManyRequests], statuses);
        Assert.True(last.Headers.Contains("Retry-After"));
    }

    private sealed class TwoPerHourFactory : ApiFactory
    {
        protected override void ConfigureWebHost(Microsoft.AspNetCore.Hosting.IWebHostBuilder builder)
        {
            base.ConfigureWebHost(builder);
            builder.UseSetting("Auth:Verification:PerUserPerHour", "2");
        }
    }
}
