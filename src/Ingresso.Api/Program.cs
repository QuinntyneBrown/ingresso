using Ingresso.Api.Auth;
using Ingresso.Api.Controllers;
using Ingresso.Api.Platform;
using Ingresso.Application;
using Ingresso.Infrastructure;
using Ingresso.Infrastructure.Outbox;
using Ingresso.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);
builder.Logging.AddJsonConsole(options => options.IncludeScopes = true);

var testSignInEnabled = builder.Configuration.GetValue<bool>("Auth:TestSignIn:Enabled");
var devMailboxExposed = builder.Configuration.GetValue<bool>("DevMailbox:Expose");
builder.Services.AddControllers(options => options.Conventions.Add(new ConditionalControllersConvention(testSignInEnabled, devMailboxExposed)));
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddIngressoAuth(builder.Environment);
builder.Services.AddSignInRateLimit(builder.Configuration);
builder.Services.AddHsts(options =>
{
    options.MaxAge = TimeSpan.FromDays(365);
    options.IncludeSubDomains = true;
    options.ExcludedHosts.Clear();
});
builder.Services.AddHealthChecks().AddDbContextCheck<AppDbContext>(tags: ["ready"]);
if (builder.Configuration.GetValue("Outbox:Enabled", true))
{
    builder.Services.AddHostedService<OutboxProcessor>();
}

var app = builder.Build();
await app.WarnIfPendingAsync();

// Pipeline order is part of the design (platform/observability, platform/security-hardening).
// 1 request logging, 2 security headers, 3 exception handling, 4 HSTS/HTTPS, 5 Swagger, 6 routing,
// 7 authentication, 8 authorization, 9 CSRF, 10 endpoints.
// Request logging stays outside the exception handler so handled statuses are logged as returned.
app.UseMiddleware<RequestLoggingMiddleware>();
app.UseMiddleware<SecurityHeadersMiddleware>();
app.UseMiddleware<ExceptionHandlingMiddleware>();
if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
    app.UseHttpsRedirection();
}

// Swagger is mapped before authentication so the document stays reachable without a session.
if (app.Configuration.GetValue("Swagger:Enabled", app.Environment.IsDevelopment()))
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseRouting();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<CsrfProtectionMiddleware>();
app.MapControllers();
app.MapHealthChecks("/health/live", new() { Predicate = _ => false }).AllowAnonymous();
app.MapHealthChecks("/health/ready", new() { Predicate = check => check.Tags.Contains("ready") }).AllowAnonymous();

app.Run();

public partial class Program;
