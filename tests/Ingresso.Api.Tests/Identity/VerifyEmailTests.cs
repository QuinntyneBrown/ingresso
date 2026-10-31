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
}
