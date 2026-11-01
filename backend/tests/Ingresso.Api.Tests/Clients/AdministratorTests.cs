using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Ingresso.Api.Tests.Infrastructure;
using Ingresso.Domain.Enums;

namespace Ingresso.Api.Tests.Clients;

/// <summary>L2-103, L2-104: only administrators reach the clients and resources API.</summary>
public sealed class AdministratorTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private async Task<HttpClient> SignedIn(string email, bool administrator = false)
    {
        var client = factory.CreateHttpsClient();
        await client.SignInAsAsync(email, administrator);
        return client;
    }

    // Acceptance Test
    // Traces to: L2-104, L2-033
    // Description: Without a session the clients and resources API answers 401.
    [Theory]
    [InlineData("/api/clients")]
    [InlineData("/api/resources")]
    public async Task Without_a_session_the_api_answers_401(string path)
    {
        var response = await factory.CreateHttpsClient().GetAsync(path);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // Acceptance Test
    // Traces to: L2-104
    // Description: A signed-in person who is not an administrator gets 403 from the clients and resources API.
    [Theory]
    [InlineData("/api/clients")]
    [InlineData("/api/resources")]
    public async Task A_member_gets_403(string path)
    {
        var client = await SignedIn(HttpClientExtensions.DevUser);

        Assert.Equal(HttpStatusCode.Forbidden, (await client.GetAsync(path)).StatusCode);
    }

    // Acceptance Test
    // Traces to: L2-103
    // Description: An administrator reads role admin from /api/auth/me and reaches the clients API; a member reads role member.
    [Fact]
    public async Task An_administrator_has_role_admin_and_reaches_the_clients_api()
    {
        var admin = await SignedIn($"admin-{Guid.NewGuid():N}@example.com", administrator: true);
        var member = await SignedIn(HttpClientExtensions.DevUser);

        Assert.Equal("admin", (await admin.GetFromJsonAsync<JsonElement>("/api/auth/me")).GetProperty("role").GetString());
        Assert.Equal("member", (await member.GetFromJsonAsync<JsonElement>("/api/auth/me")).GetProperty("role").GetString());
        Assert.Equal(HttpStatusCode.OK, (await admin.GetAsync("/api/clients")).StatusCode);
    }

    // Acceptance Test
    // Traces to: L2-103
    // Description: Someone made an administrator while signed in reaches the clients API without signing in again.
    [Fact]
    public async Task A_grant_applies_without_signing_in_again()
    {
        var email = $"later-{Guid.NewGuid():N}@example.com";
        var client = await SignedIn(email, administrator: true);
        await factory.WithDbAsync(async db =>
        {
            var user = await db.Users.SingleAsync(u => u.Email == email);
            user.Role = UserRole.Member;
            return await db.SaveChangesAsync();
        });
        Assert.Equal(HttpStatusCode.Forbidden, (await client.GetAsync("/api/clients")).StatusCode);

        await factory.WithDbAsync(async db =>
        {
            var user = await db.Users.SingleAsync(u => u.Email == email);
            user.Role = UserRole.Admin;
            return await db.SaveChangesAsync();
        });

        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/clients")).StatusCode);
    }
}
