using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Ingresso.Api.Tests.Infrastructure;
using Ingresso.Infrastructure.Seeding;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.JsonWebTokens;
using OpenIddict.Abstractions;
using static OpenIddict.Abstractions.OpenIddictConstants;

namespace Ingresso.Api.Tests.IdentityProvider;

/// <summary>L2-118, L2-119: apps receive the profile details their scopes allow, and nothing else.</summary>
public sealed class ProfileClaimsTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    /// <summary>A fresh signed-in account with this display name (none when null).</summary>
    private async Task<(HttpClient Browser, string Email)> PersonAsync(string? displayName)
    {
        var email = $"person-{Guid.NewGuid():N}@example.com";
        var browser = factory.CreateHttpsClient();
        // The seam creates a fresh verified account only for an administrator; the role doesn't affect claims.
        await browser.SignInAsAsync(email, administrator: true);
        if (displayName is not null)
        {
            (await browser.PutAsJsonAsync("/api/profile", new { displayName })).EnsureSuccessStatusCode();
        }

        return (browser, email);
    }

    private static async Task<JsonElement> TokensAsync(RelyingParty app, HttpClient browser, string scope)
    {
        var authorized = await browser.GetAsync(app.AuthorizePath(new Dictionary<string, string?> { ["scope"] = scope }));
        var response = await app.ExchangeAsync(RelyingParty.CallbackParameters(authorized)["code"]);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return await RelyingParty.JsonAsync(response);
    }

    private static JsonWebToken Token(JsonElement tokens, string name) => new(tokens.GetProperty(name).GetString()!);

    // Acceptance Test
    // Traces to: L2-118
    // Description: Discovery lists the identity scopes and the claims they carry.
    [Fact]
    public async Task Discovery_lists_profile_and_email()
    {
        var discovery = await factory.CreateHttpsClient().GetFromJsonAsync<JsonElement>("/.well-known/openid-configuration");

        var scopes = discovery.GetProperty("scopes_supported").EnumerateArray().Select(s => s.GetString()).ToList();
        var claims = discovery.GetProperty("claims_supported").EnumerateArray().Select(s => s.GetString()).ToList();
        Assert.Contains("profile", scopes);
        Assert.Contains("email", scopes);
        Assert.Superset(new HashSet<string?> { "sub", "name", "email", "email_verified" }, claims.ToHashSet());
    }

    // Acceptance Test
    // Traces to: L2-118
    // Description: With openid profile, the ID token carries the display name, and no email.
    [Fact]
    public async Task Profile_scope_shares_the_display_name()
    {
        var app = await RelyingParty.RegisterAsync(factory);
        var (browser, _) = await PersonAsync("Maya Reyes");

        var idToken = Token(await TokensAsync(app, browser, "openid profile"), "id_token");

        Assert.Equal("Maya Reyes", idToken.GetClaim("name").Value);
        Assert.False(idToken.TryGetClaim("email", out _));
    }

    // Acceptance Test
    // Traces to: L2-118
    // Description: With openid email, the ID token carries the email and that it is verified, and no name.
    [Fact]
    public async Task Email_scope_shares_the_email_and_its_verification()
    {
        var app = await RelyingParty.RegisterAsync(factory);
        var (browser, email) = await PersonAsync("Maya Reyes");

        var idToken = Token(await TokensAsync(app, browser, "openid email"), "id_token");

        Assert.Equal(email, idToken.GetClaim("email").Value);
        Assert.Equal("true", idToken.GetClaim("email_verified").Value);
        Assert.False(idToken.TryGetClaim("name", out _));
    }

    // Acceptance Test
    // Traces to: L2-118
    // Description: A person with no display name sends no name, even with profile.
    [Fact]
    public async Task No_display_name_means_no_name_claim()
    {
        var app = await RelyingParty.RegisterAsync(factory);
        var (browser, _) = await PersonAsync(null);

        var idToken = Token(await TokensAsync(app, browser, "openid profile email"), "id_token");

        Assert.False(idToken.TryGetClaim("name", out _));
    }

    // Acceptance Test
    // Traces to: L2-119
    // Description: With openid only, the ID and access tokens carry the subject and nothing about the person.
    [Fact]
    public async Task Openid_alone_shares_only_the_subject()
    {
        var app = await RelyingParty.RegisterAsync(factory);
        var (browser, _) = await PersonAsync("Maya Reyes");

        var tokens = await TokensAsync(app, browser, "openid");

        foreach (var token in new[] { Token(tokens, "id_token"), Token(tokens, "access_token") })
        {
            Assert.False(string.IsNullOrEmpty(token.Subject));
            Assert.False(token.TryGetClaim("name", out _));
            Assert.False(token.TryGetClaim("email", out _));
            Assert.False(token.TryGetClaim("email_verified", out _));
        }
    }

    // Acceptance Test
    // Traces to: L2-119
    // Description: A renewed ID token carries the display name as it is now.
    [Fact]
    public async Task A_renewed_token_has_the_current_name()
    {
        var app = await RelyingParty.RegisterWithOfflineAccessAsync(factory);
        var (browser, _) = await PersonAsync("Maya Reyes");
        var refreshToken = (await TokensAsync(app, browser, "openid profile offline_access")).GetProperty("refresh_token").GetString()!;

        (await browser.PutAsJsonAsync("/api/profile", new { displayName = "Maya Okafor-Reyes" })).EnsureSuccessStatusCode();
        var renewed = await RelyingParty.JsonAsync(await app.RefreshAsync(refreshToken));

        Assert.Equal("Maya Okafor-Reyes", Token(renewed, "id_token").GetClaim("name").Value);
    }

    // Acceptance Test
    // Traces to: L2-118
    // Description: An app registered before profile existed may ask for it once seed has run again.
    [Fact]
    public async Task Seeding_lets_older_apps_ask_for_profile()
    {
        var clientId = $"older-app-{Guid.NewGuid():N}";
        using (var scope = factory.Services.CreateScope())
        {
            var descriptor = new OpenIddictApplicationDescriptor { ClientId = clientId, DisplayName = "Older app", ClientType = ClientTypes.Public };
            descriptor.RedirectUris.Add(new Uri(RelyingParty.RedirectUri));
            descriptor.Permissions.UnionWith([
                Permissions.Endpoints.Authorization, Permissions.Endpoints.Token, Permissions.GrantTypes.AuthorizationCode,
                Permissions.ResponseTypes.Code, Permissions.Scopes.Email,
            ]);
            await scope.ServiceProvider.GetRequiredService<IOpenIddictApplicationManager>().CreateAsync(descriptor);
        }

        var app = RelyingParty.For(factory, clientId);
        var (browser, _) = await PersonAsync("Maya Reyes");
        var refused = await browser.GetAsync(app.AuthorizePath(new Dictionary<string, string?> { ["scope"] = "openid profile" }));
        using (var scope = factory.Services.CreateScope())
        {
            await scope.ServiceProvider.GetRequiredService<DatabaseSeeder>().SeedAsync();
        }

        Assert.Equal("/authorize-error", refused.Headers.Location!.OriginalString);
        Assert.Equal("Maya Reyes", Token(await TokensAsync(app, browser, "openid profile"), "id_token").GetClaim("name").Value);
    }
}
