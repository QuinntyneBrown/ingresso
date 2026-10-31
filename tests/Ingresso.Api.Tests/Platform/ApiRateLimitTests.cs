using System.Net;
using Microsoft.AspNetCore.Hosting;
using Ingresso.Api.Tests.Infrastructure;
using Ingresso.Domain.Entities;
using Ingresso.Domain.Enums;

namespace Ingresso.Api.Tests.Platform;

public sealed class ApiRateLimitTests
{
    private sealed class SmallLimitFactory : ApiFactory
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            base.ConfigureWebHost(builder);
            builder.UseSetting("RateLimit:ApiPerMinute", "5");
        }
    }

    // Acceptance Test
    // Traces to: L2-036
    // Description: Past the per-minute limit one session gets 429 with Retry-After, and another session is unaffected.
    [Fact]
    public async Task A_session_over_the_limit_gets_429_with_retry_after_and_others_are_unaffected()
    {
        using var factory = new SmallLimitFactory();
        var busy = factory.CreateHttpsClient();
        await busy.SignInAsAsync(HttpClientExtensions.DevUser);
        await factory.WithDbAsync(async db =>
        {
            db.Users.Add(new User { Email = HttpClientExtensions.OtherUser, Role = UserRole.Member, CreatedAtUtc = ApiFactory.Today });
            await db.SaveChangesAsync();
            return 0;
        });
        var other = factory.CreateHttpsClient();
        await other.SignInAsAsync(HttpClientExtensions.OtherUser);

        var statuses = new List<HttpStatusCode>();
        for (var i = 0; i < 6; i++)
        {
            statuses.Add((await busy.GetAsync("/api/tiles")).StatusCode);
        }
        var limited = await busy.GetAsync("/api/tiles");

        Assert.All(statuses.Take(4), s => Assert.Equal(HttpStatusCode.OK, s));
        Assert.Equal(HttpStatusCode.TooManyRequests, limited.StatusCode);
        Assert.NotNull(limited.Headers.RetryAfter);
        Assert.Equal(HttpStatusCode.OK, (await other.GetAsync("/api/tiles")).StatusCode);
    }

    // Acceptance Test
    // Traces to: L2-036
    // Description: Normal use below the limit is never limited, and health checks are exempt.
    [Fact]
    public async Task Normal_use_is_not_limited_and_health_is_exempt()
    {
        using var factory = new SmallLimitFactory();
        var client = factory.CreateHttpsClient();
        await client.SignInAsAsync(HttpClientExtensions.DevUser);

        for (var i = 0; i < 20; i++)
        {
            Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/health/live")).StatusCode);
        }

        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/tiles")).StatusCode);
    }
}
