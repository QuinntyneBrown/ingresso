using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Ingresso.Api.Tests.Infrastructure;

namespace Ingresso.Api.Tests.IdentityProvider;

/// <summary>L2-126: administrators mark apps they run as first-party, and those apps skip the consent page.</summary>
public sealed class FirstPartyTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private async Task<HttpClient> AdministratorAsync()
    {
        var admin = factory.CreateHttpsClient();
        await admin.SignInAsAsync($"admin-{Guid.NewGuid():N}@example.com", administrator: true);
        return admin;
    }

    private static object App(string name, bool? firstParty) => firstParty is { } value
        ? new { name, redirectUris = new[] { RelyingParty.RedirectUri }, firstParty = value }
        : new { name, redirectUris = new[] { RelyingParty.RedirectUri } };

    private async Task<HttpResponseMessage> AuthorizeAsync(string clientId)
    {
        var browser = factory.CreateHttpsClient();
        await browser.SignInAsAsync(HttpClientExtensions.DevUser);
        return await browser.GetAsync(RelyingParty.For(factory, clientId).AuthorizePath(new Dictionary<string, string?> { ["scope"] = "openid profile email" }));
    }

    private static async Task<JsonElement> ClientAsync(HttpResponseMessage response) =>
        (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("client");

    // Acceptance Test
    // Traces to: L2-126
    // Description: An app registered as first-party says so and signs people in without the consent page.
    [Fact]
    public async Task A_first_party_app_skips_consent()
    {
        var admin = await AdministratorAsync();
        var client = await ClientAsync(await admin.PostAsJsonAsync("/api/clients", App($"Budget {Guid.NewGuid():N}"[..15], firstParty: true)));

        var response = await AuthorizeAsync(client.GetProperty("clientId").GetString()!);

        Assert.True(client.GetProperty("firstParty").GetBoolean());
        Assert.True(RelyingParty.CallbackParameters(response).ContainsKey("code"));
    }

    // Acceptance Test
    // Traces to: L2-126, L2-121
    // Description: A new app is not first-party unless ticked, so it asks.
    [Fact]
    public async Task New_apps_ask_by_default()
    {
        var admin = await AdministratorAsync();
        var client = await ClientAsync(await admin.PostAsJsonAsync("/api/clients", App($"Notes {Guid.NewGuid():N}"[..14], firstParty: null)));

        var response = await AuthorizeAsync(client.GetProperty("clientId").GetString()!);

        Assert.False(client.GetProperty("firstParty").GetBoolean());
        Assert.StartsWith("/consent?", response.Headers.Location!.OriginalString);
    }

    // Acceptance Test
    // Traces to: L2-126, L2-112
    // Description: Editing an app sets and clears first-party; the list shows it, and consent follows.
    [Fact]
    public async Task Editing_an_app_sets_first_party()
    {
        var admin = await AdministratorAsync();
        var name = $"Notes {Guid.NewGuid():N}"[..14];
        var clientId = (await ClientAsync(await admin.PostAsJsonAsync("/api/clients", App(name, firstParty: null)))).GetProperty("clientId").GetString()!;

        var edited = await admin.PutAsJsonAsync($"/api/clients/{clientId}", App(name, firstParty: true));
        var skipped = await AuthorizeAsync(clientId);
        var listed = (await admin.GetFromJsonAsync<JsonElement>("/api/clients")).EnumerateArray().Single(c => c.GetProperty("clientId").GetString() == clientId);
        await admin.PutAsJsonAsync($"/api/clients/{clientId}", App(name, firstParty: false));
        var asked = await AuthorizeAsync(clientId);

        Assert.Equal(HttpStatusCode.OK, edited.StatusCode);
        Assert.True(listed.GetProperty("firstParty").GetBoolean());
        Assert.True(RelyingParty.CallbackParameters(skipped).ContainsKey("code"));
        Assert.StartsWith("/consent?", asked.Headers.Location!.OriginalString);
    }
}
