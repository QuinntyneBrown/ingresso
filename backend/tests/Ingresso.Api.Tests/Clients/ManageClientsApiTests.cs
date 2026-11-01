using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Ingresso.Api.Tests.IdentityProvider;
using Ingresso.Api.Tests.Infrastructure;

namespace Ingresso.Api.Tests.Clients;

/// <summary>L2-112 to L2-116: administrators edit, rotate, disable, enable and delete registered apps.</summary>
public sealed class ManageClientsApiTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private const string Redirect = RelyingParty.RedirectUri;

    private async Task<HttpClient> Administrator()
    {
        var client = factory.CreateHttpsClient();
        await client.SignInAsAsync($"admin-{Guid.NewGuid():N}@example.com", administrator: true);
        return client;
    }

    /// <summary>Registers an app through the API and returns its client ID and name.</summary>
    private static async Task<(string ClientId, string Name)> RegisterAsync(HttpClient admin, bool confidential = false)
    {
        var (clientId, name, _) = await RegisterWithSecretAsync(admin, confidential);
        return (clientId, name);
    }

    /// <summary>Registers an app through the API and returns its client ID, name and secret (null for a public app).</summary>
    private static async Task<(string ClientId, string Name, string? Secret)> RegisterWithSecretAsync(HttpClient admin, bool confidential)
    {
        var name = $"Notes {Guid.NewGuid():N}"[..14];
        var response = await admin.PostAsJsonAsync("/api/clients", new { name, redirectUris = new[] { Redirect }, confidential, offlineAccess = true });
        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        var secret = body.GetProperty("clientSecret").ValueKind == JsonValueKind.Null ? null : body.GetProperty("clientSecret").GetString();
        return (body.GetProperty("client").GetProperty("clientId").GetString()!, name, secret);
    }

    /// <summary>Signs the seeded person in to the app and exchanges the code with this secret; returns the token response.</summary>
    private async Task<HttpResponseMessage> SignInWithSecretAsync(string clientId, string? secret)
    {
        var app = RelyingParty.For(factory, clientId);
        var browser = factory.CreateHttpsClient();
        await browser.SignInAsAsync(HttpClientExtensions.DevUser);
        var authorized = await browser.GetAsync(app.AuthorizePath());
        return await app.ExchangeAsync(RelyingParty.CallbackParameters(authorized)["code"], clientSecret: secret);
    }

    private static object Changes(string name, string[]? redirectUris = null, bool offlineAccess = false) => new
    {
        name,
        redirectUris = redirectUris ?? new[] { Redirect, "https://app.example.com/oidc-callback" },
        postLogoutRedirectUris = new[] { "https://app.example.com/signout-callback-oidc" },
        frontChannelLogoutUri = "https://app.example.com/frontchannel-logout",
        scopes = Array.Empty<string>(),
        offlineAccess,
    };

    // Acceptance Test
    // Traces to: L2-112, L2-116
    // Description: An administrator changes an app's name, addresses and offline access; the response and the list show the new values.
    [Fact]
    public async Task An_administrator_edits_an_app()
    {
        var admin = await Administrator();
        var (clientId, _) = await RegisterAsync(admin);
        var renamed = $"Notes {Guid.NewGuid():N}"[..14];

        var response = await admin.PutAsJsonAsync($"/api/clients/{clientId}", Changes(renamed, offlineAccess: true));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var client = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(renamed, client.GetProperty("name").GetString());
        Assert.Equal([Redirect, "https://app.example.com/oidc-callback"], client.GetProperty("redirectUris").EnumerateArray().Select(u => u.GetString()));
        Assert.Equal(["https://app.example.com/signout-callback-oidc"], client.GetProperty("postLogoutRedirectUris").EnumerateArray().Select(u => u.GetString()));
        Assert.Equal("https://app.example.com/frontchannel-logout", client.GetProperty("frontChannelLogoutUri").GetString());
        Assert.True(client.GetProperty("offlineAccess").GetBoolean());
        var listed = (await admin.GetFromJsonAsync<JsonElement>("/api/clients")).EnumerateArray().Single(a => a.GetProperty("clientId").GetString() == clientId);
        Assert.Equal(renamed, listed.GetProperty("name").GetString());
    }

    // Acceptance Test
    // Traces to: L2-112
    // Description: Changes breaking the registration rules change nothing and answer 400 with the registration messages.
    [Fact]
    public async Task Invalid_changes_answer_400_and_change_nothing()
    {
        var admin = await Administrator();
        var (clientId, name) = await RegisterAsync(admin);

        var response = await admin.PutAsJsonAsync($"/api/clients/{clientId}", Changes("", ["notes.example.com/signin-oidc"]));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var errors = (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");
        Assert.Equal("Enter a name for the app.", errors.GetProperty("name")[0].GetString());
        Assert.Contains("'notes.example.com/signin-oidc'", errors.GetProperty("redirectUris[0]")[0].GetString());
        var listed = (await admin.GetFromJsonAsync<JsonElement>("/api/clients")).EnumerateArray().Single(a => a.GetProperty("clientId").GetString() == clientId);
        Assert.Equal(name, listed.GetProperty("name").GetString());
    }

    // Acceptance Test
    // Traces to: L2-112
    // Description: Another app's name is refused with 409; keeping the app's own name is fine.
    [Fact]
    public async Task Another_apps_name_is_refused_but_its_own_is_kept()
    {
        var admin = await Administrator();
        var (clientId, name) = await RegisterAsync(admin);
        var (_, other) = await RegisterAsync(admin);

        var taken = await admin.PutAsJsonAsync($"/api/clients/{clientId}", Changes(other.ToUpperInvariant()));
        var kept = await admin.PutAsJsonAsync($"/api/clients/{clientId}", Changes(name));

        Assert.Equal(HttpStatusCode.Conflict, taken.StatusCode);
        Assert.Equal(HttpStatusCode.OK, kept.StatusCode);
    }

    // Acceptance Test
    // Traces to: L2-112, L2-094
    // Description: After a redirect address is removed, an authorization request using it never redirects there.
    [Fact]
    public async Task A_removed_redirect_address_is_no_longer_trusted()
    {
        var admin = await Administrator();
        var (clientId, name) = await RegisterAsync(admin);
        await admin.PutAsJsonAsync($"/api/clients/{clientId}", Changes(name, ["https://app.example.com/oidc-callback"]));
        var browser = factory.CreateHttpsClient();
        await browser.SignInAsAsync(HttpClientExtensions.DevUser);

        var response = await browser.GetAsync(RelyingParty.For(factory, clientId).AuthorizePath());

        Assert.Equal(HttpStatusCode.Redirect, response.StatusCode);
        Assert.Equal("/authorize-error", response.Headers.Location!.OriginalString);
    }

    // Acceptance Test
    // Traces to: L2-116
    // Description: Changing an app ingresso doesn't know answers 404.
    [Fact]
    public async Task Editing_an_unknown_app_answers_404()
    {
        var admin = await Administrator();

        var response = await admin.PutAsJsonAsync("/api/clients/no-such-app", Changes("Notes"));

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    // Acceptance Test
    // Traces to: L2-116
    // Description: A member gets 403 and an anonymous caller 401 from every change endpoint.
    [Theory]
    [InlineData("PUT", "/api/clients/some-app")]
    [InlineData("POST", "/api/clients/some-app/secret")]
    [InlineData("POST", "/api/clients/some-app/disable")]
    [InlineData("POST", "/api/clients/some-app/enable")]
    [InlineData("DELETE", "/api/clients/some-app")]
    public async Task Only_administrators_change_apps(string method, string path)
    {
        var member = factory.CreateHttpsClient();
        await member.SignInAsAsync(HttpClientExtensions.DevUser);
        HttpRequestMessage Request() => new(new HttpMethod(method), path) { Content = JsonContent.Create(Changes("Notes")) };

        Assert.Equal(HttpStatusCode.Forbidden, (await member.SendAsync(Request())).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await factory.CreateHttpsClient().SendAsync(Request())).StatusCode);
    }

    // Acceptance Test
    // Traces to: L2-113, L2-116
    // Description: Rotating a confidential app's secret returns a new one; the old secret is refused and the new one gets tokens.
    [Fact]
    public async Task Rotating_a_secret_replaces_it()
    {
        var admin = await Administrator();
        var (clientId, _, oldSecret) = await RegisterWithSecretAsync(admin, confidential: true);

        var response = await admin.PostAsync($"/api/clients/{clientId}/secret", null);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        var newSecret = body.GetProperty("clientSecret").GetString()!;
        Assert.Equal(clientId, body.GetProperty("client").GetProperty("clientId").GetString());
        Assert.NotEqual(oldSecret, newSecret);
        Assert.True(newSecret.Length >= 43);
        Assert.Equal(HttpStatusCode.Unauthorized, (await SignInWithSecretAsync(clientId, oldSecret)).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await SignInWithSecretAsync(clientId, newSecret)).StatusCode);
    }

    // Acceptance Test
    // Traces to: L2-113
    // Description: A public app has no secret to rotate: 400.
    [Fact]
    public async Task A_public_app_has_no_secret_to_rotate()
    {
        var admin = await Administrator();
        var (clientId, _) = await RegisterAsync(admin);

        var response = await admin.PostAsync($"/api/clients/{clientId}/secret", null);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    // Acceptance Test
    // Traces to: L2-116
    // Description: Rotating the secret of an app ingresso doesn't know answers 404.
    [Fact]
    public async Task Rotating_an_unknown_apps_secret_answers_404()
    {
        var admin = await Administrator();

        Assert.Equal(HttpStatusCode.NotFound, (await admin.PostAsync("/api/clients/no-such-app/secret", null)).StatusCode);
    }

    // Acceptance Test
    // Traces to: L2-112
    // Description: Editing a confidential app keeps its secret working.
    [Fact]
    public async Task Editing_a_confidential_app_keeps_its_secret()
    {
        var admin = await Administrator();
        var (clientId, name, secret) = await RegisterWithSecretAsync(admin, confidential: true);

        (await admin.PutAsJsonAsync($"/api/clients/{clientId}", Changes(name))).EnsureSuccessStatusCode();

        Assert.Equal(HttpStatusCode.OK, (await SignInWithSecretAsync(clientId, secret)).StatusCode);
    }

    private static async Task AssertInvalidGrantAsync(HttpResponseMessage response)
    {
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("invalid_grant", (await RelyingParty.JsonAsync(response)).GetProperty("error").GetString());
    }

    // Acceptance Test
    // Traces to: L2-114, L2-116
    // Description: Disable and enable return the app with its state, and the list says whether each app is disabled.
    [Fact]
    public async Task Disable_and_enable_change_the_apps_state()
    {
        var admin = await Administrator();
        var (clientId, _) = await RegisterAsync(admin);

        var disabled = await admin.PostAsync($"/api/clients/{clientId}/disable", null);
        var listed = (await admin.GetFromJsonAsync<JsonElement>("/api/clients")).EnumerateArray().Single(a => a.GetProperty("clientId").GetString() == clientId);
        var enabled = await admin.PostAsync($"/api/clients/{clientId}/enable", null);

        Assert.True((await disabled.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("disabled").GetBoolean());
        Assert.True(listed.GetProperty("disabled").GetBoolean());
        Assert.False((await enabled.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("disabled").GetBoolean());
    }

    // Acceptance Test
    // Traces to: L2-114
    // Description: A disabled app's authorization request gets no code and goes to the authorize error page.
    [Fact]
    public async Task A_disabled_app_signs_no_one_in()
    {
        var admin = await Administrator();
        var (clientId, _) = await RegisterAsync(admin);
        await admin.PostAsync($"/api/clients/{clientId}/disable", null);
        var browser = factory.CreateHttpsClient();
        await browser.SignInAsAsync(HttpClientExtensions.DevUser);

        var response = await browser.GetAsync(RelyingParty.For(factory, clientId).AuthorizePath());

        Assert.Equal(HttpStatusCode.Redirect, response.StatusCode);
        Assert.Equal("/authorize-error", response.Headers.Location!.OriginalString);
    }

    // Acceptance Test
    // Traces to: L2-114
    // Description: A code issued before the app was disabled is refused at the token endpoint.
    [Fact]
    public async Task A_disabled_app_cannot_exchange_a_code()
    {
        var admin = await Administrator();
        var (clientId, _) = await RegisterAsync(admin);
        var app = RelyingParty.For(factory, clientId);
        var browser = factory.CreateHttpsClient();
        await browser.SignInAsAsync(HttpClientExtensions.DevUser);
        var code = RelyingParty.CallbackParameters(await browser.GetAsync(app.AuthorizePath()))["code"];

        await admin.PostAsync($"/api/clients/{clientId}/disable", null);

        await AssertInvalidGrantAsync(await app.ExchangeAsync(code));
    }

    // Acceptance Test
    // Traces to: L2-114
    // Description: A disabled app's refresh token is refused, and works again once the app is enabled.
    [Fact]
    public async Task A_disabled_app_cannot_renew_until_it_is_enabled()
    {
        var admin = await Administrator();
        var (clientId, _) = await RegisterAsync(admin);
        var app = RelyingParty.For(factory, clientId);
        var refreshToken = (await app.SignInOfflineAsync()).GetProperty("refresh_token").GetString()!;

        await admin.PostAsync($"/api/clients/{clientId}/disable", null);
        await AssertInvalidGrantAsync(await app.RefreshAsync(refreshToken));
        await admin.PostAsync($"/api/clients/{clientId}/enable", null);

        Assert.Equal(HttpStatusCode.OK, (await app.RefreshAsync(refreshToken)).StatusCode);
    }

    // Acceptance Test
    // Traces to: L2-116
    // Description: Disabling an app ingresso doesn't know answers 404.
    [Fact]
    public async Task Disabling_an_unknown_app_answers_404()
    {
        var admin = await Administrator();

        Assert.Equal(HttpStatusCode.NotFound, (await admin.PostAsync("/api/clients/no-such-app/disable", null)).StatusCode);
    }

    // Acceptance Test
    // Traces to: L2-115, L2-116
    // Description: Deleting an app answers 204, leaves the list, and its refresh token is refused.
    [Fact]
    public async Task Deleting_an_app_removes_it_and_its_tokens()
    {
        var admin = await Administrator();
        var (clientId, _) = await RegisterAsync(admin);
        var app = RelyingParty.For(factory, clientId);
        var refreshToken = (await app.SignInOfflineAsync()).GetProperty("refresh_token").GetString()!;

        var response = await admin.DeleteAsync($"/api/clients/{clientId}");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        var listed = await admin.GetFromJsonAsync<JsonElement>("/api/clients");
        Assert.DoesNotContain(listed.EnumerateArray(), a => a.GetProperty("clientId").GetString() == clientId);
        Assert.NotEqual(HttpStatusCode.OK, (await app.RefreshAsync(refreshToken)).StatusCode);
    }

    // Acceptance Test
    // Traces to: L2-116
    // Description: Deleting an app ingresso doesn't know answers 404.
    [Fact]
    public async Task Deleting_an_unknown_app_answers_404()
    {
        var admin = await Administrator();

        Assert.Equal(HttpStatusCode.NotFound, (await admin.DeleteAsync("/api/clients/no-such-app")).StatusCode);
    }
}
