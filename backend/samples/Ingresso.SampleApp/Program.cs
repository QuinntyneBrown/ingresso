using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;

// A minimal app that signs people in with ingresso over OpenID Connect (journey 16) and calls its own API with the
// access token ingresso issues (journey 17). Playwright and the demos use it as the relying party; it is also the
// reference for configuring an ASP.NET Core app and its API against ingresso.
var builder = WebApplication.CreateBuilder(args);
var authority = builder.Configuration["SampleApp:Authority"] ?? "http://localhost:4200";
var clientId = builder.Configuration["SampleApp:ClientId"] ?? "ingresso-sample-app";
var audience = builder.Configuration["SampleApp:Audience"] ?? "ingresso-sample-api";
var apiScope = builder.Configuration["SampleApp:Scope"] ?? "sample-api.read";
var localAuthority = authority.StartsWith("http://localhost", StringComparison.OrdinalIgnoreCase);

builder.Services.AddAuthentication(options =>
    {
        options.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = OpenIdConnectDefaults.AuthenticationScheme;
    })
    .AddCookie(options => options.Cookie.Name = "sample-app.session")
    .AddOpenIdConnect(options =>
    {
        options.Authority = authority;
        options.ClientId = clientId;
        options.ResponseType = "code";
        // ingresso's Content-Security-Policy blocks form_post to another origin; use the query response mode.
        options.ResponseMode = "query";
        options.UsePkce = true;
        options.Scope.Clear();
        options.Scope.Add("openid");
        options.Scope.Add("email");
        options.Scope.Add(apiScope);
        // Keep the access token in the session cookie, so the app can call its API for the person.
        options.SaveTokens = true;
        options.MapInboundClaims = false;
        options.GetClaimsFromUserInfoEndpoint = false;
        options.RequireHttpsMetadata = !localAuthority;
        // Local runs are plain http; the correlation and nonce cookies must still round-trip.
        options.CorrelationCookie.SameSite = SameSiteMode.Lax;
        options.CorrelationCookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
        options.NonceCookie.SameSite = SameSiteMode.Lax;
        options.NonceCookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
    })
    // The app's API: accepts only ingresso access tokens issued for its audience, validated against discovery.
    .AddJwtBearer(options =>
    {
        options.Authority = authority;
        options.Audience = audience;
        options.MapInboundClaims = false;
        options.RequireHttpsMetadata = !localAuthority;
    });
builder.Services.AddAuthorization();
builder.Services.AddHttpClient();

var app = builder.Build();
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/", async (HttpContext context, IHttpClientFactory http) =>
{
    var email = context.User.FindFirst("email")?.Value;
    var body = email is null
        ? """
          <p>You’re not signed in.</p>
          <p><a class="button" href="/signin">Sign in with ingresso</a></p>
          """
        : $"""
          <p data-signed-in-as>Signed in as {WebUtility.HtmlEncode(email)}</p>
          <p class="api" data-api-result>{WebUtility.HtmlEncode(await CallApiAsync(context, http))}</p>
          """;
    return Results.Content(Page(body), "text/html; charset=utf-8");
});

// The protected API. A real app would host it separately; the sample keeps it in one process.
app.MapGet("/api/me", (HttpContext context) => Results.Ok(new
    {
        email = context.User.FindFirst("email")?.Value,
        scope = context.User.FindFirst("scope")?.Value,
    }))
    .RequireAuthorization(policy => policy.AddAuthenticationSchemes(JwtBearerDefaults.AuthenticationScheme).RequireAuthenticatedUser());

app.MapGet("/signin", () => Results.Challenge(new AuthenticationProperties { RedirectUri = "/" }));

app.Run();

// Calls the app's own API with the person's access token and says what it answered.
static async Task<string> CallApiAsync(HttpContext context, IHttpClientFactory http)
{
    var accessToken = await context.GetTokenAsync("access_token");
    using var request = new HttpRequestMessage(HttpMethod.Get, $"{context.Request.Scheme}://{context.Request.Host}/api/me");
    request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
    using var response = await http.CreateClient().SendAsync(request);
    if (!response.IsSuccessStatusCode)
    {
        return $"Your API refused the call ({(int)response.StatusCode}).";
    }

    var me = await response.Content.ReadFromJsonAsync<JsonElement>();
    return $"Your API says: hello, {me.GetProperty("email").GetString()}. Scope: {me.GetProperty("scope").GetString()}";
}

static string Page(string body) => $$"""
    <!doctype html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Sample app</title>
      <style>
        body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #f4f6fb; color: #1d2433;
               font: 18px/1.5 system-ui, sans-serif; }
        main { width: min(480px, calc(100% - 32px)); padding: 32px; border-radius: 12px; background: #fff;
               box-shadow: 0 8px 24px rgb(0 0 0 / .08); }
        h1 { margin: 0 0 8px; font-size: 28px; }
        .button { display: inline-block; padding: 10px 18px; border-radius: 8px; background: #1d2433; color: #fff;
                  text-decoration: none; font-weight: 600; }
        .api { margin: 16px 0 0; padding: 12px 16px; border-radius: 8px; background: #eef4ff; }
        .button:focus-visible { outline: 3px solid #4f7cff; outline-offset: 2px; }
      </style>
    </head>
    <body>
      <main>
        <h1>Sample app</h1>
        {{body}}
      </main>
    </body>
    </html>
    """;
