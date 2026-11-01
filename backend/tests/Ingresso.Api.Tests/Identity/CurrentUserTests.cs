using System.Net.Http.Json;
using System.Text.Json;
using Ingresso.Api.Tests.Infrastructure;

namespace Ingresso.Api.Tests.Identity;

/// <summary>L2-146: the current user carries the display name and the email as separate fields.</summary>
public sealed class CurrentUserTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private async Task<(HttpClient Client, string Email)> SignedIn()
    {
        var email = $"person-{Guid.NewGuid():N}@example.com";
        var client = factory.CreateHttpsClient();
        // The seam creates a fresh account only for an administrator; the role doesn't affect the greeting.
        await client.SignInAsAsync(email, administrator: true);
        return (client, email);
    }

    private static async Task<JsonElement> Me(HttpClient client) =>
        await client.GetFromJsonAsync<JsonElement>("/api/auth/me");

    // Acceptance Test
    // Traces to: L2-146
    // Description: Without a display name, displayName is null and the email comes on its own; no field merges them.
    [Fact]
    public async Task Without_a_display_name_the_current_user_has_a_null_display_name_and_the_email()
    {
        var (client, email) = await SignedIn();

        var me = await Me(client);

        Assert.Equal(JsonValueKind.Null, me.GetProperty("displayName").ValueKind);
        Assert.Equal(email, me.GetProperty("email").GetString());
        Assert.False(me.TryGetProperty("name", out _));
    }

    // Acceptance Test
    // Traces to: L2-146
    // Description: A saved display name comes back as displayName, apart from the email.
    [Fact]
    public async Task With_a_display_name_the_current_user_carries_it_apart_from_the_email()
    {
        var (client, email) = await SignedIn();
        await client.PutAsJsonAsync("/api/profile", new { displayName = "Maya Reyes" });

        var me = await Me(client);

        Assert.Equal("Maya Reyes", me.GetProperty("displayName").GetString());
        Assert.Equal(email, me.GetProperty("email").GetString());
    }
}
