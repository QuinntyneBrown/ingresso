using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Ingresso.Api.Tests.Infrastructure;

namespace Ingresso.Api.Tests.IdentityProvider;

/// <summary>L2-120: the userinfo endpoint answers with the claims the access token's scopes allow.</summary>
public sealed class UserinfoTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private async Task<(string AccessToken, HttpClient Browser, string Email)> SignInAsync(string scope, string? displayName = "Maya Reyes")
    {
        var app = await RelyingParty.RegisterAsync(factory);
        var email = $"person-{Guid.NewGuid():N}@example.com";
        var browser = factory.CreateHttpsClient();
        // The seam creates a fresh verified account only for an administrator; the role doesn't affect claims.
        await browser.SignInAsAsync(email, administrator: true);
        if (displayName is not null)
        {
            (await browser.PutAsJsonAsync("/api/profile", new { displayName })).EnsureSuccessStatusCode();
        }

        var authorized = await browser.GetAsync(app.AuthorizePath(new Dictionary<string, string?> { ["scope"] = scope }));
        var tokens = await RelyingParty.JsonAsync(await app.ExchangeAsync(RelyingParty.CallbackParameters(authorized)["code"]));
        return (tokens.GetProperty("access_token").GetString()!, browser, email);
    }

    private async Task<HttpResponseMessage> UserinfoAsync(string? accessToken)
    {
        var request = new HttpRequestMessage(HttpMethod.Get, "/connect/userinfo");
        if (accessToken is not null)
        {
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        }

        return await factory.CreateHttpsClient().SendAsync(request);
    }

    // Acceptance Test
    // Traces to: L2-120
    // Description: Discovery names the userinfo endpoint.
    [Fact]
    public async Task Discovery_names_the_userinfo_endpoint()
    {
        var discovery = await factory.CreateHttpsClient().GetFromJsonAsync<JsonElement>("/.well-known/openid-configuration");

        Assert.EndsWith("/connect/userinfo", discovery.GetProperty("userinfo_endpoint").GetString());
    }

    // Acceptance Test
    // Traces to: L2-120
    // Description: With profile and email, userinfo returns sub, name, email and email_verified, read as they are now.
    [Fact]
    public async Task Userinfo_returns_what_the_scopes_allow_as_it_is_now()
    {
        var (token, browser, email) = await SignInAsync("openid profile email");
        (await browser.PutAsJsonAsync("/api/profile", new { displayName = "Maya Okafor-Reyes" })).EnsureSuccessStatusCode();

        var response = await UserinfoAsync(token);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var claims = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.False(string.IsNullOrEmpty(claims.GetProperty("sub").GetString()));
        Assert.Equal("Maya Okafor-Reyes", claims.GetProperty("name").GetString());
        Assert.Equal(email, claims.GetProperty("email").GetString());
        Assert.True(claims.GetProperty("email_verified").GetBoolean());
    }

    // Acceptance Test
    // Traces to: L2-120, L2-119
    // Description: With openid only, userinfo returns only sub.
    [Fact]
    public async Task Openid_alone_gets_only_the_subject()
    {
        var (token, _, _) = await SignInAsync("openid");

        var claims = await (await UserinfoAsync(token)).Content.ReadFromJsonAsync<JsonElement>();

        Assert.Equal(["sub"], claims.EnumerateObject().Select(p => p.Name).ToArray());
    }

    // Acceptance Test
    // Traces to: L2-120
    // Description: No token or an invalid one gets 401 with a WWW-Authenticate error and no claims.
    [Theory]
    [InlineData(null)]
    [InlineData("not-a-token")]
    public async Task Without_a_valid_token_userinfo_answers_401(string? token)
    {
        var response = await UserinfoAsync(token);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.NotEmpty(response.Headers.WwwAuthenticate);
        Assert.DoesNotContain("sub", await response.Content.ReadAsStringAsync());
    }
}
