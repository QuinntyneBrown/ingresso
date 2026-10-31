using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;

namespace Ingresso.Api.Auth;

/// <summary>Per-IP limits (L2-082): 20 sign-in links and 30 custom feed links an hour, and per-account 3 verification emails an hour (L2-029); configurable for tests.</summary>
public static class SignInRateLimit
{
    public const string Policy = "sign-in-links";
    public const string FeedCreationPolicy = "feed-creation";
    public const string VerificationPolicy = "verification-emails";

    public static IServiceCollection AddSignInRateLimit(this IServiceCollection services, IConfiguration configuration)
    {
        var perHour = configuration.GetValue("Auth:SignInLinks:PerIpPerHour", 20);
        var feedsPerHour = configuration.GetValue("Feeds:CreatePerIpPerHour", 30);
        var verificationsPerHour = configuration.GetValue("Auth:Verification:PerUserPerHour", 3);
        var apiPerMinute = configuration.GetValue("RateLimit:ApiPerMinute", 300);
        return services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            options.OnRejected = (context, _) =>
            {
                var retry = context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var after) ? after : TimeSpan.FromHours(1);
                context.HttpContext.Response.Headers.RetryAfter = ((int)Math.Ceiling(retry.TotalSeconds)).ToString(System.Globalization.CultureInfo.InvariantCulture);
                return ValueTask.CompletedTask;
            };
            // Every /api request counts against the caller's session, or their IP address when anonymous (L2-036).
            options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
            {
                if (!context.Request.Path.StartsWithSegments("/api"))
                {
                    return RateLimitPartition.GetNoLimiter("outside-api");
                }

                var caller = context.User.Identity?.IsAuthenticated == true
                    ? "user:" + context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                    : "ip:" + (context.Connection.RemoteIpAddress?.ToString() ?? "unknown");
                return RateLimitPartition.GetFixedWindowLimiter(caller,
                    _ => new FixedWindowRateLimiterOptions { PermitLimit = apiPerMinute, Window = TimeSpan.FromMinutes(1), QueueLimit = 0 });
            });
            options.AddPolicy(Policy, context => RateLimitPartition.GetFixedWindowLimiter(
                context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                _ => new FixedWindowRateLimiterOptions { PermitLimit = perHour, Window = TimeSpan.FromHours(1), QueueLimit = 0 }));
            // Another verification email: a few an hour per account, so the inbox is not flooded (L2-029).
            options.AddPolicy(VerificationPolicy, context => RateLimitPartition.GetFixedWindowLimiter(
                context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                _ => new FixedWindowRateLimiterOptions { PermitLimit = verificationsPerHour, Window = TimeSpan.FromHours(1), QueueLimit = 0 }));
            // Custom feed links: 30 an hour per IP address (L2-082, build-custom-feed design).
            options.AddPolicy(FeedCreationPolicy, context => RateLimitPartition.GetFixedWindowLimiter(
                context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                _ => new FixedWindowRateLimiterOptions { PermitLimit = feedsPerHour, Window = TimeSpan.FromHours(1), QueueLimit = 0 }));
        });
    }
}
