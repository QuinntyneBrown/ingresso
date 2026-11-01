using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Ingresso.Api.Tests.Infrastructure;

namespace Ingresso.Api.Tests.Identity;

/// <summary>L2-132 to L2-135: people see the devices they're signed in on and end the others.</summary>
public sealed class DevicesTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private const string MacChrome =
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
    private const string IPhoneSafari =
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1";
    private const string WindowsFirefox = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0";
    private const string WindowsEdge =
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0";
    private const string AndroidChrome =
        "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36";

    /// <summary>A browser on a device, signed in as the person.</summary>
    private async Task<HttpClient> DeviceAsync(string email, string? userAgent)
    {
        var browser = factory.CreateHttpsClient();
        if (userAgent is not null)
        {
            browser.DefaultRequestHeaders.UserAgent.ParseAdd(userAgent);
        }

        await browser.SignInAsAsync(email, administrator: true);
        return browser;
    }

    private static string NewEmail() => $"person-{Guid.NewGuid():N}@example.com";

    private static async Task<List<JsonElement>> ListAsync(HttpClient browser) =>
        (await browser.GetFromJsonAsync<JsonElement>("/api/sessions")).EnumerateArray().ToList();

    // Acceptance Test
    // Traces to: L2-132
    // Description: Each of the person's devices is listed as "<browser> on <system>", with this device marked.
    [Fact]
    public async Task Your_devices_are_listed_with_this_one_marked()
    {
        var email = NewEmail();
        await DeviceAsync(email, IPhoneSafari);
        var mac = await DeviceAsync(email, MacChrome);

        var devices = await ListAsync(mac);

        Assert.Equal(2, devices.Count);
        var current = Assert.Single(devices, d => d.GetProperty("current").GetBoolean());
        Assert.Equal("Chrome on macOS", current.GetProperty("device").GetString());
        var other = Assert.Single(devices, d => !d.GetProperty("current").GetBoolean());
        Assert.Equal("Safari on iPhone", other.GetProperty("device").GetString());
        Assert.True(other.TryGetProperty("signedInAt", out _));
        Assert.True(other.TryGetProperty("lastActiveAt", out _));
    }

    // Acceptance Test
    // Traces to: L2-132, L2-038
    // Description: Common browsers and systems are named coarsely, and a missing user agent reads "Unknown device".
    [Theory]
    [InlineData(WindowsFirefox, "Firefox on Windows")]
    [InlineData(WindowsEdge, "Edge on Windows")]
    [InlineData(AndroidChrome, "Chrome on Android")]
    [InlineData(null, "Unknown device")]
    public async Task Devices_are_described_coarsely(string? userAgent, string expected)
    {
        var browser = await DeviceAsync(NewEmail(), userAgent);

        var device = Assert.Single(await ListAsync(browser));

        Assert.Equal(expected, device.GetProperty("device").GetString());
        Assert.Equal(["id", "device", "signedInAt", "lastActiveAt", "current"], device.EnumerateObject().Select(p => p.Name));
    }

    // Acceptance Test
    // Traces to: L2-132, L2-032
    // Description: Other people's sessions are never listed.
    [Fact]
    public async Task Only_your_own_devices_are_listed()
    {
        await DeviceAsync(NewEmail(), IPhoneSafari);
        var mine = await DeviceAsync(NewEmail(), MacChrome);

        Assert.Single(await ListAsync(mine));
    }

    // Acceptance Test
    // Traces to: L2-132
    // Description: Without a session, the list is refused.
    [Fact]
    public async Task The_list_needs_a_session()
    {
        Assert.Equal(HttpStatusCode.Unauthorized, (await factory.CreateHttpsClient().GetAsync("/api/sessions")).StatusCode);
    }
}
