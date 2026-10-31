using System.Net.Http.Json;
using Ingresso.Api.Tests.Infrastructure;

namespace Ingresso.Api.Tests.Platform;

public sealed class LogPrivacyTests(PlatformFactory factory) : IClassFixture<PlatformFactory>
{
    // Acceptance Test
    // Traces to: L2-038
    // Description: Logging a signed-in request that carries a tile address records no email, token, cookie or address.
    [Fact]
    public async Task Logs_hold_no_email_token_cookie_or_tile_address()
    {
        var client = factory.CreateHttpsClient();
        await client.GetAsync("/health/live");
        factory.Logs.Entries.Clear();
        await client.SignInAsAsync(HttpClientExtensions.DevUser);
        var address = "https://private-app.example.com/secret-path?token=abc123";

        var created = await client.PostAsJsonAsync("/api/tiles", new { name = "Private", url = address, color = "#2563EB" });
        created.EnsureSuccessStatusCode();
        await client.GetAsync("/api/tiles");

        var everything = string.Join("\n", factory.Logs.Entries.Select(e =>
            e.Message + " " + string.Join(" ", e.State.Select(kv => $"{kv.Key}={kv.Value}")) + " " + e.Exception));
        Assert.DoesNotContain(HttpClientExtensions.DevUser, everything);
        Assert.DoesNotContain("private-app.example.com", everything);
        Assert.DoesNotContain("abc123", everything);
        Assert.DoesNotContain("XSRF-TOKEN", everything);
        Assert.DoesNotContain(".AspNetCore", everything, StringComparison.OrdinalIgnoreCase);
    }
}
