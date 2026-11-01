using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Ingresso.Api.Tests.Infrastructure;

namespace Ingresso.Api.Tests.Identity;

/// <summary>L2-117: a signed-in person reads and changes their own display name.</summary>
public sealed class ProfileApiTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private async Task<(HttpClient Client, string Email)> SignedIn()
    {
        var email = $"person-{Guid.NewGuid():N}@example.com";
        var client = factory.CreateHttpsClient();
        // The seam creates a fresh account only for an administrator; the role doesn't affect the profile.
        await client.SignInAsAsync(email, administrator: true);
        return (client, email);
    }

    private static async Task<JsonElement> ProfileOf(HttpClient client) =>
        await client.GetFromJsonAsync<JsonElement>("/api/profile");

    // Acceptance Test
    // Traces to: L2-117
    // Description: A new account has no display name; its profile shows the email.
    [Fact]
    public async Task A_new_profile_has_no_display_name()
    {
        var (client, email) = await SignedIn();

        var profile = await ProfileOf(client);

        Assert.Equal(JsonValueKind.Null, profile.GetProperty("displayName").ValueKind);
        Assert.Equal(email, profile.GetProperty("email").GetString());
    }

    // Acceptance Test
    // Traces to: L2-117
    // Description: Saving a name trims it; the header's name and initials follow it.
    [Fact]
    public async Task Setting_a_display_name_trims_it_and_the_header_uses_it()
    {
        var (client, _) = await SignedIn();

        var response = await client.PutAsJsonAsync("/api/profile", new { displayName = "  Maya Reyes  " });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("Maya Reyes", (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("displayName").GetString());
        Assert.Equal("Maya Reyes", (await ProfileOf(client)).GetProperty("displayName").GetString());
        var me = await client.GetFromJsonAsync<JsonElement>("/api/auth/me");
        Assert.Equal("Maya Reyes", me.GetProperty("name").GetString());
        Assert.Equal("MR", me.GetProperty("initials").GetString());
    }

    // Acceptance Test
    // Traces to: L2-117
    // Description: An empty name clears it, and the email is used again.
    [Fact]
    public async Task An_empty_name_clears_it()
    {
        var (client, email) = await SignedIn();
        await client.PutAsJsonAsync("/api/profile", new { displayName = "Maya Reyes" });

        var response = await client.PutAsJsonAsync("/api/profile", new { displayName = "   " });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(JsonValueKind.Null, (await ProfileOf(client)).GetProperty("displayName").ValueKind);
        Assert.Equal(email, (await client.GetFromJsonAsync<JsonElement>("/api/auth/me")).GetProperty("name").GetString());
    }

    // Acceptance Test
    // Traces to: L2-117
    // Description: Too long, or with line breaks or control characters: 400 with the message, and nothing changes.
    [Theory]
    [InlineData(101, "", "Keep your display name to 100 characters or fewer.")]
    [InlineData(0, "Maya\nReyes", "Your display name can't contain line breaks or control characters.")]
    [InlineData(0, "Maya\u0007", "Your display name can't contain line breaks or control characters.")]
    public async Task Invalid_names_are_refused(int length, string name, string message)
    {
        var (client, _) = await SignedIn();
        await client.PutAsJsonAsync("/api/profile", new { displayName = "Maya Reyes" });

        var response = await client.PutAsJsonAsync("/api/profile", new { displayName = length > 0 ? new string('a', length) : name });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var errors = (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");
        Assert.Equal(message, errors.GetProperty("displayName")[0].GetString());
        Assert.Equal("Maya Reyes", (await ProfileOf(client)).GetProperty("displayName").GetString());
    }

    // Acceptance Test
    // Traces to: L2-117
    // Description: Exactly 100 characters is allowed.
    [Fact]
    public async Task A_name_of_100_characters_is_allowed()
    {
        var (client, _) = await SignedIn();

        var response = await client.PutAsJsonAsync("/api/profile", new { displayName = new string('a', 100) });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    // Acceptance Test
    // Traces to: L2-117
    // Description: Without a session, the profile answers 401.
    [Fact]
    public async Task The_profile_needs_a_session()
    {
        var anonymous = factory.CreateHttpsClient();

        Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.GetAsync("/api/profile")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.PutAsJsonAsync("/api/profile", new { displayName = "X" })).StatusCode);
    }
}
