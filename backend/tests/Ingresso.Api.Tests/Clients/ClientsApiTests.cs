using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using Ingresso.Api.Tests.IdentityProvider;
using Ingresso.Api.Tests.Infrastructure;
using Ingresso.Application.Clients;

namespace Ingresso.Api.Tests.Clients;

/// <summary>L2-104 to L2-106: listing and registering apps through /api/clients.</summary>
public sealed class ClientsApiTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private async Task<HttpClient> Administrator()
    {
        var client = factory.CreateHttpsClient();
        await client.SignInAsAsync($"admin-{Guid.NewGuid():N}@example.com", administrator: true);
        return client;
    }

    private async Task RegisterWithCliHandlerAsync(string name)
    {
        using var scope = factory.Services.CreateScope();
        await scope.ServiceProvider.GetRequiredService<ISender>()
            .Send(new RegisterClientCommand(name, [$"https://{name.Replace(" ", "-").ToLowerInvariant()}.example.com/signin-oidc"], []));
    }

    // Acceptance Test
    // Traces to: L2-104
    // Description: An administrator lists every registered app by name with its client ID and type, sorted by name.
    [Fact]
    public async Task An_administrator_lists_the_registered_apps_sorted_by_name()
    {
        var admin = await Administrator();
        var suffix = Guid.NewGuid().ToString("N")[..8];
        await RegisterWithCliHandlerAsync($"Zeta {suffix}");
        await RegisterWithCliHandlerAsync($"Alpha {suffix}");

        var response = await admin.GetAsync("/api/clients");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var apps = (await response.Content.ReadFromJsonAsync<JsonElement>()).EnumerateArray()
            .Where(a => a.GetProperty("name").GetString()!.EndsWith(suffix, StringComparison.Ordinal))
            .ToList();
        Assert.Equal([$"Alpha {suffix}", $"Zeta {suffix}"], apps.Select(a => a.GetProperty("name").GetString()));
        Assert.All(apps, a =>
        {
            Assert.False(string.IsNullOrEmpty(a.GetProperty("clientId").GetString()));
            Assert.False(a.GetProperty("confidential").GetBoolean());
            Assert.False(a.TryGetProperty("clientSecret", out _));
        });
    }

    private static object Registration(string name, bool confidential = false, string[]? redirectUris = null) => new
    {
        name,
        redirectUris = redirectUris ?? ["https://notes.example.com/signin-oidc"],
        postLogoutRedirectUris = new[] { "https://notes.example.com/signout-callback-oidc" },
        frontChannelLogoutUri = "https://notes.example.com/frontchannel-logout",
        scopes = Array.Empty<string>(),
        confidential,
    };

    // Acceptance Test
    // Traces to: L2-107
    // Description: An app registered with offlineAccess is returned and listed as allowed offline access.
    [Fact]
    public async Task An_administrator_registers_an_app_allowed_offline_access()
    {
        var admin = await Administrator();
        var name = $"Budget {Guid.NewGuid():N}"[..15];

        var response = await admin.PostAsJsonAsync("/api/clients", new
        {
            name,
            redirectUris = new[] { "https://budget.example.com/signin-oidc" },
            offlineAccess = true,
        });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var client = (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("client");
        Assert.True(client.GetProperty("offlineAccess").GetBoolean());
        var listed = await admin.GetFromJsonAsync<JsonElement>("/api/clients");
        Assert.True(listed.EnumerateArray().Single(a => a.GetProperty("name").GetString() == name).GetProperty("offlineAccess").GetBoolean());
    }

    // Acceptance Test
    // Traces to: L2-105
    // Description: An administrator registers a public app; it is returned with no secret and then listed.
    [Fact]
    public async Task An_administrator_registers_a_public_app()
    {
        var admin = await Administrator();
        var name = $"Notes {Guid.NewGuid():N}"[..14];

        var response = await admin.PostAsJsonAsync("/api/clients", Registration(name));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        var client = body.GetProperty("client");
        Assert.Equal(name, client.GetProperty("name").GetString());
        Assert.False(client.GetProperty("confidential").GetBoolean());
        Assert.Equal(["https://notes.example.com/signin-oidc"], client.GetProperty("redirectUris").EnumerateArray().Select(u => u.GetString()));
        Assert.Equal("https://notes.example.com/frontchannel-logout", client.GetProperty("frontChannelLogoutUri").GetString());
        Assert.Equal(JsonValueKind.Null, body.GetProperty("clientSecret").ValueKind);
        var listed = await admin.GetFromJsonAsync<JsonElement>("/api/clients");
        Assert.Contains(listed.EnumerateArray(), a => a.GetProperty("clientId").GetString() == client.GetProperty("clientId").GetString());
    }

    // Acceptance Test
    // Traces to: L2-105
    // Description: Entries breaking the rules register nothing and answer 400 with each field's message, the CLI's words.
    [Fact]
    public async Task Invalid_entries_answer_400_with_field_messages()
    {
        var admin = await Administrator();
        var before = (await admin.GetFromJsonAsync<JsonElement>("/api/clients")).GetArrayLength();

        var response = await admin.PostAsJsonAsync("/api/clients", Registration("", redirectUris: ["notes.example.com/signin-oidc"]));
        var none = await admin.PostAsJsonAsync("/api/clients", Registration("Nameless", redirectUris: []));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var errors = (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");
        Assert.Equal("Enter a name for the app.", errors.GetProperty("name")[0].GetString());
        Assert.Equal(
            "The address 'notes.example.com/signin-oidc' must be a full address like https://app.example.com/signin-oidc.",
            errors.GetProperty("redirectUris[0]")[0].GetString());
        Assert.Equal(HttpStatusCode.BadRequest, none.StatusCode);
        Assert.Equal(
            "Add at least one redirect address.",
            (await none.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors").GetProperty("redirectUris")[0].GetString());
        Assert.Equal(before, (await admin.GetFromJsonAsync<JsonElement>("/api/clients")).GetArrayLength());
    }

    // Acceptance Test
    // Traces to: L2-105
    // Description: A name already registered answers 409 and registers nothing more.
    [Fact]
    public async Task A_name_in_use_answers_409()
    {
        var admin = await Administrator();
        var name = $"Dup {Guid.NewGuid():N}"[..12];
        (await admin.PostAsJsonAsync("/api/clients", Registration(name))).EnsureSuccessStatusCode();

        var again = await admin.PostAsJsonAsync("/api/clients", Registration(name.ToUpperInvariant()));

        Assert.Equal(HttpStatusCode.Conflict, again.StatusCode);
    }

    // Acceptance Test
    // Traces to: L2-104
    // Description: Someone who is not an administrator cannot register an app.
    [Fact]
    public async Task A_member_cannot_register_an_app()
    {
        var member = factory.CreateHttpsClient();
        await member.SignInAsAsync(HttpClientExtensions.DevUser);

        var response = await member.PostAsJsonAsync("/api/clients", Registration("Sneaky"));

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    private async Task<(string ClientId, string Secret, HttpClient Admin)> RegisterConfidentialAsync()
    {
        var admin = await Administrator();
        var response = await admin.PostAsJsonAsync("/api/clients", new
        {
            name = $"Budget {Guid.NewGuid():N}"[..15],
            redirectUris = new[] { RelyingParty.RedirectUri },
            confidential = true,
        });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(body.GetProperty("client").GetProperty("confidential").GetBoolean());
        return (body.GetProperty("client").GetProperty("clientId").GetString()!, body.GetProperty("clientSecret").GetString()!, admin);
    }

    // Acceptance Test
    // Traces to: L2-106
    // Description: A confidential app gets a random secret of at least 256 bits, returned once; listing the apps never shows it.
    [Fact]
    public async Task A_confidential_app_gets_a_secret_shown_only_once()
    {
        var (clientId, secret, admin) = await RegisterConfidentialAsync();
        var (_, other, _) = await RegisterConfidentialAsync();

        Assert.True(Convert.FromBase64String(secret.Replace('-', '+').Replace('_', '/') + new string('=', (4 - secret.Length % 4) % 4)).Length >= 32);
        Assert.NotEqual(secret, other);
        var listed = await admin.GetStringAsync("/api/clients");
        Assert.DoesNotContain(secret, listed, StringComparison.Ordinal);
        var app = JsonDocument.Parse(listed).RootElement.EnumerateArray().Single(a => a.GetProperty("clientId").GetString() == clientId);
        Assert.True(app.GetProperty("confidential").GetBoolean());
    }

    // Acceptance Test
    // Traces to: L2-106
    // Description: A confidential app's code gets tokens with the right secret and PKCE verifier; no secret or a wrong one is invalid_client.
    [Theory]
    [InlineData("right", HttpStatusCode.OK, null)]
    [InlineData("none", HttpStatusCode.Unauthorized, "invalid_client")]
    [InlineData("wrong", HttpStatusCode.Unauthorized, "invalid_client")]
    public async Task The_token_endpoint_checks_a_confidential_apps_secret(string secretKind, HttpStatusCode status, string? error)
    {
        var (clientId, secret, _) = await RegisterConfidentialAsync();
        var app = RelyingParty.For(factory, clientId);
        var browser = factory.CreateHttpsClient();
        await browser.SignInAsAsync(HttpClientExtensions.DevUser);
        var code = RelyingParty.CallbackParameters(await browser.GetAsync(app.AuthorizePath()))["code"];

        var response = await app.ExchangeAsync(code, clientSecret: secretKind switch
        {
            "right" => secret,
            "wrong" => secret[..^2] + "xx",
            _ => null,
        });

        Assert.Equal(status, response.StatusCode);
        var json = await RelyingParty.JsonAsync(response);
        if (error is null)
        {
            Assert.False(string.IsNullOrEmpty(json.GetProperty("id_token").GetString()));
        }
        else
        {
            Assert.Equal(error, json.GetProperty("error").GetString());
            Assert.False(json.TryGetProperty("id_token", out _));
        }
    }
}
