using System.Net;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;

// A minimal app that signs people in with ingresso over OpenID Connect (journey 16). Playwright and the demos use it as
// the relying party; it is also the reference for configuring an ASP.NET Core app against ingresso.
var builder = WebApplication.CreateBuilder(args);
var authority = builder.Configuration["SampleApp:Authority"] ?? "http://localhost:4200";
var clientId = builder.Configuration["SampleApp:ClientId"] ?? "ingresso-sample-app";

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
        options.MapInboundClaims = false;
        options.GetClaimsFromUserInfoEndpoint = false;
        options.RequireHttpsMetadata = !authority.StartsWith("http://localhost", StringComparison.OrdinalIgnoreCase);
        // Local runs are plain http; the correlation and nonce cookies must still round-trip.
        options.CorrelationCookie.SameSite = SameSiteMode.Lax;
        options.CorrelationCookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
        options.NonceCookie.SameSite = SameSiteMode.Lax;
        options.NonceCookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
    });
builder.Services.AddAuthorization();

var app = builder.Build();
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/", (HttpContext context) =>
{
    var email = context.User.FindFirst("email")?.Value;
    var body = email is null
        ? """
          <p>You’re not signed in.</p>
          <p><a class="button" href="/signin">Sign in with ingresso</a></p>
          """
        : $"""
          <p data-signed-in-as>Signed in as {WebUtility.HtmlEncode(email)}</p>
          """;
    return Results.Content(Page(body), "text/html; charset=utf-8");
});

app.MapGet("/signin", () => Results.Challenge(new AuthenticationProperties { RedirectUri = "/" }));

app.Run();

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
