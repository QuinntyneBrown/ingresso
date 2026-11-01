using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Ingresso.Api.Tests.Infrastructure;

namespace Ingresso.Api.Tests.IdentityProvider;

/// <summary>L2-128 to L2-131: people see the apps they approved and revoke them.</summary>
public sealed class ConnectedAppsTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private const string Scopes = "openid profile email offline_access";

    /// <summary>A fresh person, signed in; the seam creates fresh verified accounts only for administrators.</summary>
    private async Task<HttpClient> PersonAsync()
    {
        var browser = factory.CreateHttpsClient();
        await browser.SignInAsAsync($"person-{Guid.NewGuid():N}@example.com", administrator: true);
        return browser;
    }

    /// <summary>Approves the app for the person, signs in to it and returns the token response.</summary>
    private static async Task<JsonElement> ConnectAsync(HttpClient browser, RelyingParty app)
    {
        (await browser.PostAsJsonAsync("/api/consent", new { clientId = app.ClientId, scope = Scopes })).EnsureSuccessStatusCode();
        var authorized = await browser.GetAsync(app.AuthorizePath(new Dictionary<string, string?> { ["scope"] = Scopes }));
        return await RelyingParty.JsonAsync(await app.ExchangeAsync(RelyingParty.CallbackParameters(authorized)["code"]));
    }

    private static async Task<List<JsonElement>> ListAsync(HttpClient browser) =>
        (await browser.GetFromJsonAsync<JsonElement>("/api/connected-apps")).EnumerateArray().ToList();

    // Acceptance Test
    // Traces to: L2-128
    // Description: An approved app is listed with what it can do in plain words, when it was approved and when it last got a token.
    [Fact]
    public async Task An_approved_app_is_listed()
    {
        var app = await RelyingParty.RegisterAskingConsentAsync(factory, offlineAccess: true);
        var browser = await PersonAsync();
        var before = DateTimeOffset.UtcNow.AddMinutes(-1);
        await ConnectAsync(browser, app);

        var listed = Assert.Single(await ListAsync(browser));

        Assert.Equal(app.ClientId, listed.GetProperty("clientId").GetString());
        Assert.StartsWith("Sample app ", listed.GetProperty("name").GetString());
        Assert.Equal(
            ["See your display name", "See your email address", "Stay signed in when you’re not using it"],
            listed.GetProperty("scopes").EnumerateArray().Select(s => s.GetProperty("title").GetString()));
        Assert.True(listed.GetProperty("approvedAt").GetDateTimeOffset() > before);
        Assert.True(listed.GetProperty("lastUsedAt").GetDateTimeOffset() >= listed.GetProperty("approvedAt").GetDateTimeOffset(), listed.ToString());
    }

    // Acceptance Test
    // Traces to: L2-128
    // Description: People see only their own connected apps.
    [Fact]
    public async Task Only_your_own_apps_are_listed()
    {
        var app = await RelyingParty.RegisterAskingConsentAsync(factory, offlineAccess: true);
        await ConnectAsync(await PersonAsync(), app);

        var someoneElse = await PersonAsync();

        Assert.Empty(await ListAsync(someoneElse));
    }

    // Acceptance Test
    // Traces to: L2-128, L2-032
    // Description: Without a session, the list is refused.
    [Fact]
    public async Task The_list_needs_a_session()
    {
        var response = await factory.CreateHttpsClient().GetAsync("/api/connected-apps");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
