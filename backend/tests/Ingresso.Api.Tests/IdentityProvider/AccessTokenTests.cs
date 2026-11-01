using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;
using Ingresso.Api.Tests.Infrastructure;

namespace Ingresso.Api.Tests.IdentityProvider;

/// <summary>L2-096 to L2-098: allowed scopes, access tokens, and an app's API that validates them against discovery.</summary>
public sealed class AccessTokenTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    // Acceptance Test
    // Traces to: L2-096
    // Description: An app asking for an API scope it is not allowed gets no code and is not redirected; the person sees the authorize error page.
    [Fact]
    public async Task A_scope_the_app_is_not_allowed_is_refused()
    {
        var (_, scope) = await RelyingParty.RegisterApiAsync(factory);
        var app = await RelyingParty.RegisterAsync(factory);
        var browser = factory.CreateHttpsClient();
        await browser.SignInAsAsync(HttpClientExtensions.DevUser);

        var response = await browser.GetAsync(app.AuthorizePath(new Dictionary<string, string?> { ["scope"] = $"openid {scope}" }));

        // OpenIddict checks scope permissions before it accepts the redirect address, so it never redirects.
        Assert.Equal(HttpStatusCode.Redirect, response.StatusCode);
        Assert.Equal("/authorize-error", response.Headers.Location!.OriginalString);
    }

    // Acceptance Test
    // Traces to: L2-097
    // Description: The access token is a signed, unencrypted JWT for the API's audience, naming the person and the granted scope.
    [Fact]
    public async Task The_access_token_is_a_signed_jwt_for_the_api_naming_the_person_and_scope()
    {
        var (audience, scope) = await RelyingParty.RegisterApiAsync(factory);
        var app = await RelyingParty.RegisterAsync(factory, "Sample app", scope);

        var accessToken = await app.AccessTokenAsync(scope);

        var jwks = new JsonWebKeySet(await factory.CreateHttpsClient().GetStringAsync("/.well-known/jwks"));
        var result = await new JsonWebTokenHandler().ValidateTokenAsync(accessToken, new TokenValidationParameters
        {
            IssuerSigningKeys = jwks.GetSigningKeys(),
            ValidIssuer = "https://ingresso.dev/",
            ValidAudience = audience,
            ValidateLifetime = false,
        });
        Assert.True(result.IsValid, result.Exception?.Message);
        var token = (JsonWebToken)result.SecurityToken;
        var userId = await factory.WithDbAsync(db => db.Users.Where(u => u.Email == HttpClientExtensions.DevUser).Select(u => u.Id).SingleAsync());
        Assert.Equal(userId.ToString(), token.Subject);
        Assert.Equal([audience], token.Audiences);
        Assert.Contains(scope, token.GetClaim("scope").Value.Split(' '));
    }

    // Acceptance Test
    // Traces to: L2-097
    // Description: With no configured lifetime, an access token expires 10 minutes after it was issued.
    [Fact]
    public async Task An_access_token_expires_after_ten_minutes_by_default()
    {
        var (_, scope) = await RelyingParty.RegisterApiAsync(factory);
        var app = await RelyingParty.RegisterAsync(factory, "Sample app", scope);

        var token = new JsonWebToken(await app.AccessTokenAsync(scope));

        Assert.Equal(TimeSpan.FromMinutes(10), token.ValidTo - token.IssuedAt);
    }

    // Acceptance Test
    // Traces to: L2-097
    // Description: IdentityProvider:AccessTokenLifetime sets how long access tokens last.
    [Fact]
    public async Task The_access_token_lifetime_is_configurable()
    {
        using var configured = new ShortLivedTokensFactory();
        var (_, scope) = await RelyingParty.RegisterApiAsync(configured);
        var app = await RelyingParty.RegisterAsync(configured, "Sample app", scope);

        var token = new JsonWebToken(await app.AccessTokenAsync(scope));

        Assert.Equal(TimeSpan.FromMinutes(2), token.ValidTo - token.IssuedAt);
    }

    // Acceptance Test
    // Traces to: L2-098
    // Description: An API validating against ingresso's discovery document accepts a token issued for its audience.
    [Fact]
    public async Task An_api_accepts_a_token_issued_for_it()
    {
        var (audience, scope) = await RelyingParty.RegisterApiAsync(factory);
        var app = await RelyingParty.RegisterAsync(factory, "Sample app", scope);
        var accessToken = await app.AccessTokenAsync(scope);
        await using var api = await AppApi.StartAsync(factory, audience);

        var response = await api.CallAsync(accessToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement;
        var userId = await factory.WithDbAsync(db => db.Users.Where(u => u.Email == HttpClientExtensions.DevUser).Select(u => u.Id).SingleAsync());
        Assert.Equal(userId.ToString(), body.GetProperty("sub").GetString());
    }

    // Acceptance Test
    // Traces to: L2-097, L2-098
    // Description: A token past its lifetime is refused by the API (1-second lifetime, no clock skew).
    [Fact]
    public async Task An_api_refuses_an_expired_token()
    {
        using var configured = new ShortLivedTokensFactory("00:00:01");
        var (audience, scope) = await RelyingParty.RegisterApiAsync(configured);
        var app = await RelyingParty.RegisterAsync(configured, "Sample app", scope);
        var accessToken = await app.AccessTokenAsync(scope);
        await using var api = await AppApi.StartAsync(configured, audience, clockSkew: TimeSpan.Zero);
        await Task.Delay(TimeSpan.FromSeconds(2));

        Assert.Equal(HttpStatusCode.Unauthorized, (await api.CallAsync(accessToken)).StatusCode);
    }

    // Acceptance Test
    // Traces to: L2-098
    // Description: The API refuses a token whose signature was altered, and a token for another API.
    [Theory]
    [InlineData("tampered")]
    [InlineData("other audience")]
    public async Task An_api_refuses_an_expired_tampered_or_other_audience_token(string problem)
    {
        var (audience, scope) = await RelyingParty.RegisterApiAsync(factory);
        var (_, otherScope) = await RelyingParty.RegisterApiAsync(factory);
        var app = await RelyingParty.RegisterAsync(factory, "Sample app", scope, otherScope);
        var accessToken = await app.AccessTokenAsync(problem == "other audience" ? otherScope : scope);
        if (problem == "tampered")
        {
            var signature = accessToken[(accessToken.LastIndexOf('.') + 1)..];
            accessToken = accessToken[..(accessToken.LastIndexOf('.') + 1)] + (signature[0] == 'A' ? 'B' : 'A') + signature[1..];
        }

        await using var api = await AppApi.StartAsync(factory, audience);

        Assert.Equal(HttpStatusCode.Unauthorized, (await api.CallAsync(accessToken)).StatusCode);
    }

    private sealed class ShortLivedTokensFactory(string lifetime = "00:02:00") : ApiFactory
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            base.ConfigureWebHost(builder);
            builder.UseSetting("IdentityProvider:AccessTokenLifetime", lifetime);
        }
    }

    /// <summary>
    /// An app's API configured as the sample app's is: JwtBearer with ingresso as the authority and its audience, reading
    /// discovery and keys from the ingresso test server.
    /// </summary>
    private sealed class AppApi(WebApplication app) : IAsyncDisposable
    {
        public static async Task<AppApi> StartAsync(ApiFactory ingresso, string audience, TimeSpan? clockSkew = null)
        {
            var builder = WebApplication.CreateBuilder();
            builder.WebHost.UseTestServer();
            builder.Services.AddAuthentication().AddJwtBearer(options =>
            {
                options.Authority = "https://localhost";
                options.Audience = audience;
                options.MapInboundClaims = false;
                options.BackchannelHttpHandler = ingresso.Server.CreateHandler();
                if (clockSkew is { } skew)
                {
                    options.TokenValidationParameters.ClockSkew = skew;
                }
            });
            builder.Services.AddAuthorization();
            var app = builder.Build();
            app.UseAuthentication();
            app.UseAuthorization();
            app.MapGet("/api/me", (HttpContext context) => Results.Ok(new { sub = context.User.FindFirst("sub")?.Value }))
                .RequireAuthorization(policy => policy.AddAuthenticationSchemes(JwtBearerDefaults.AuthenticationScheme).RequireAuthenticatedUser());
            await app.StartAsync();
            return new AppApi(app);
        }

        public Task<HttpResponseMessage> CallAsync(string accessToken)
        {
            var client = app.GetTestClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
            return client.GetAsync("/api/me");
        }

        public ValueTask DisposeAsync() => app.DisposeAsync();
    }
}
