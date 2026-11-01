using System.Globalization;
using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

// A minimal app that signs people in with ingresso over OpenID Connect (journey 16), calls its own API with the
// access token ingresso issues (journey 17), and renews that token with a refresh token when it expires (journey 20). Playwright and the demos use it as the relying party; it is also the
// reference for configuring an ASP.NET Core app and its API against ingresso.
var builder = WebApplication.CreateBuilder(args);
var authority = builder.Configuration["SampleApp:Authority"] ?? "http://localhost:4200";
var clientId = builder.Configuration["SampleApp:ClientId"] ?? "ingresso-sample-app";
var audience = builder.Configuration["SampleApp:Audience"] ?? "ingresso-sample-api";
var apiScope = builder.Configuration["SampleApp:Scope"] ?? "sample-api.read";
var localAuthority = authority.StartsWith("http://localhost", StringComparison.OrdinalIgnoreCase);

// How soon after one refetch of ingresso's keys a token with an unknown key may trigger another (ASP.NET's default
// is 5 minutes). Playwright rotates keys more than once a run, so it shortens this.
var keysRefreshInterval = builder.Configuration.GetValue<TimeSpan?>("SampleApp:KeysRefreshInterval");

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
        // profile brings the person's display name as `name`; email brings their address (L2-118).
        options.Scope.Add("profile");
        options.Scope.Add("email");
        options.Scope.Add(apiScope);
        // A refresh token, so the app renews its access token without sending the person back (journey 20).
        options.Scope.Add("offline_access");
        // Keep the access token in the session cookie, so the app can call its API for the person.
        options.SaveTokens = true;
        options.MapInboundClaims = false;
        options.GetClaimsFromUserInfoEndpoint = false;
        options.RequireHttpsMetadata = !localAuthority;
        options.RefreshInterval = keysRefreshInterval ?? options.RefreshInterval;
        // Local runs are plain http; the correlation and nonce cookies must still round-trip.
        options.CorrelationCookie.SameSite = SameSiteMode.Lax;
        options.CorrelationCookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
        options.NonceCookie.SameSite = SameSiteMode.Lax;
        options.NonceCookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
        // Deny on ingresso's consent page comes back as access_denied: say so on the home page, not as an error (L2-124).
        options.Events.OnAccessDenied = context =>
        {
            context.Response.Redirect("/?denied=1");
            context.HandleResponse();
            return Task.CompletedTask;
        };
        // Right after ingresso rotates its signing key (journey 26), the handler doesn't know the new key yet: it
        // refuses that ID token and fetches the JWKS again. Start the sign-in over once; ingresso's session makes it
        // quiet.
        options.Events.OnRemoteFailure = context =>
        {
            if (context.Failure is SecurityTokenSignatureKeyNotFoundException && context.Properties?.Items.ContainsKey("retried") != true)
            {
                context.Response.Redirect("/signin?again=true");
                context.HandleResponse();
            }

            return Task.CompletedTask;
        };
    })
    // The app's API: accepts only ingresso access tokens issued for its audience, validated against discovery.
    .AddJwtBearer(options =>
    {
        options.Authority = authority;
        options.Audience = audience;
        options.MapInboundClaims = false;
        // An expired token is refused at once, not five minutes later; the app renews it instead.
        options.TokenValidationParameters.ClockSkew = TimeSpan.Zero;
        options.RequireHttpsMetadata = !localAuthority;
        options.RefreshInterval = keysRefreshInterval ?? options.RefreshInterval;
    });
builder.Services.AddAuthorization();
builder.Services.AddHttpClient();

var app = builder.Build();
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/", async (HttpContext context, IHttpClientFactory http, IOptionsMonitor<OpenIdConnectOptions> oidc) =>
{
    const string signIn = """<p><a class="button" href="/signin">Sign in with ingresso</a></p>""";
    var email = context.User.FindFirst("email")?.Value;
    if (email is null)
    {
        var status = context.Request.Query.ContainsKey("denied")
            ? "<p data-denied>You chose not to let Sample app use your ingresso account.</p>"
            : "<p>You’re not signed in.</p>";
        return Results.Content(Page($"{status}{signIn}"), "text/html; charset=utf-8");
    }

    var renewals = await RenewIfExpiredAsync(context, http, oidc.Get(OpenIdConnectDefaults.AuthenticationScheme));
    if (renewals is null)
    {
        // ingresso refused the renewal: its session ended, or the token was revoked. Sign out here too.
        await context.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return Results.Content(Page($"<p>Your ingresso session has ended. Sign in again.</p>{signIn}"), "text/html; charset=utf-8");
    }

    var renewed = renewals > 0
        ? $"""<p data-token-renewals>Access token renewed quietly {renewals} {(renewals == 1 ? "time" : "times")}.</p>"""
        : "";
    // The display name when ingresso sent one, else the email; always encoded, never markup (L2-037).
    var greeting = context.User.FindFirst("name")?.Value ?? email;
    var body = $"""
        <p class="greeting" data-greeting>Hello, {WebUtility.HtmlEncode(greeting)}</p>
        <p data-signed-in-as>Signed in as {WebUtility.HtmlEncode(email)}</p>
        <p class="api" data-api-result>{WebUtility.HtmlEncode(await CallApiAsync(context, http))}</p>
        {renewed}
        <p><a class="button" href="/signout">Sign out</a></p>
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

app.MapGet("/signin", (bool? again) =>
{
    var properties = new AuthenticationProperties { RedirectUri = "/" };
    if (again == true)
    {
        properties.Items["retried"] = "1";
    }

    return Results.Challenge(properties);
});

// Signs out here and through ingresso's end-session endpoint, which signs out every app of the session (journey 18).
app.MapGet("/signout", () => Results.SignOut(
    new AuthenticationProperties { RedirectUri = "/" },
    [CookieAuthenticationDefaults.AuthenticationScheme, OpenIdConnectDefaults.AuthenticationScheme]));

// Front-channel logout: ingresso loads this in a hidden frame when the ingresso session ends. End this app's session
// if it came from that ingresso session.
app.MapGet("/frontchannel-logout", async (HttpContext context, string? sid) =>
{
    if (sid is not null && context.User.FindFirst("sid")?.Value == sid)
    {
        await context.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
    }

    context.Response.Headers.CacheControl = "no-store";
    return Results.Content("<!doctype html><title>Signed out</title>", "text/html; charset=utf-8");
});

app.Run();

// Renews the access token with the refresh token once it has expired, and keeps the new tokens in the cookie. Returns
// how many times this sign-in has renewed, or null when ingresso refused (L2-107, L2-110).
static async Task<int?> RenewIfExpiredAsync(HttpContext context, IHttpClientFactory http, OpenIdConnectOptions oidc)
{
    var result = await context.AuthenticateAsync(CookieAuthenticationDefaults.AuthenticationScheme);
    var properties = result.Properties!;
    var renewals = properties.Items.TryGetValue("renewals", out var saved) && int.TryParse(saved, out var count) ? count : 0;
    var expiresAt = DateTimeOffset.Parse(properties.GetTokenValue("expires_at")!, CultureInfo.InvariantCulture);
    if (expiresAt > DateTimeOffset.UtcNow.AddSeconds(1))
    {
        return renewals;
    }

    var configuration = await oidc.ConfigurationManager!.GetConfigurationAsync(context.RequestAborted);
    using var response = await http.CreateClient().PostAsync(configuration.TokenEndpoint, new FormUrlEncodedContent(new Dictionary<string, string>
    {
        ["grant_type"] = "refresh_token",
        ["client_id"] = oidc.ClientId!,
        ["refresh_token"] = properties.GetTokenValue("refresh_token") ?? "",
    }));
    if (!response.IsSuccessStatusCode)
    {
        return null;
    }

    var tokens = await response.Content.ReadFromJsonAsync<JsonElement>();
    properties.UpdateTokenValue("access_token", tokens.GetProperty("access_token").GetString()!);
    properties.UpdateTokenValue("refresh_token", tokens.GetProperty("refresh_token").GetString()!);
    properties.UpdateTokenValue("id_token", tokens.GetProperty("id_token").GetString()!);
    properties.UpdateTokenValue(
        "expires_at", DateTimeOffset.UtcNow.AddSeconds(tokens.GetProperty("expires_in").GetInt32()).ToString("o", CultureInfo.InvariantCulture));
    properties.Items["renewals"] = (renewals + 1).ToString(CultureInfo.InvariantCulture);
    await context.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, result.Principal!, properties);
    return renewals + 1;
}

// Calls the app's own API with the person's access token and says what it answered.
static async Task<string> CallApiAsync(HttpContext context, IHttpClientFactory http)
{
    var accessToken = await context.GetTokenAsync("access_token");
    async Task<HttpResponseMessage> SendAsync()
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, $"{context.Request.Scheme}://{context.Request.Host}/api/me");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        return await http.CreateClient().SendAsync(request);
    }

    var response = await SendAsync();
    // After ingresso rotates its signing key (journey 26), the API refuses the first token signed with the new key
    // while it fetches the new JWKS, so the app tries once more.
    if (response.StatusCode == HttpStatusCode.Unauthorized
        && response.Headers.WwwAuthenticate.ToString().Contains("signature key was not found", StringComparison.OrdinalIgnoreCase))
    {
        response.Dispose();
        response = await SendAsync();
    }

    using var _ = response;
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
        .greeting { margin: 0 0 4px; font-size: 20px; font-weight: 600; }
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
