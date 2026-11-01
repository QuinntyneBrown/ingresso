using System.Net;
using Microsoft.AspNetCore.Hosting;
using Ingresso.Api.Tests.Infrastructure;

namespace Ingresso.Api.Tests.Identity;

/// <summary>L2-082: sign-in links are limited to 5 an hour per email and 20 an hour per IP address.</summary>
public sealed class SignInRateLimitTests
{
    // Acceptance Test
    // Traces to: L2-027
    // Description: The sixth request for one address in an hour gets 429 with Retry-After.
    [Fact]
    public async Task The_sixth_request_in_an_hour_for_one_address_is_429_and_sends_nothing()
    {
        using var factory = new ApiFactory();
        var email = "busy@example.com";
        for (var i = 0; i < 5; i++)
        {
            Assert.Equal(HttpStatusCode.Accepted, (await factory.RequestLink(email)).StatusCode);
        }

        var response = await factory.RequestLink(email);

        Assert.Equal(HttpStatusCode.TooManyRequests, response.StatusCode);
        Assert.NotNull(response.Headers.RetryAfter);
    }

    // Acceptance Test
    // Traces to: L2-027
    // Description: Requests beyond the per-IP limit get 429 with Retry-After.
    [Fact]
    public async Task Requests_beyond_the_per_address_limit_of_one_client_are_429()
    {
        using var factory = new SmallIpLimitFactory();
        for (var i = 0; i < 3; i++)
        {
            Assert.Equal(HttpStatusCode.Accepted, (await factory.RequestLink($"ip-{i}@example.com")).StatusCode);
        }

        var response = await factory.RequestLink("ip-4@example.com");

        Assert.Equal(HttpStatusCode.TooManyRequests, response.StatusCode);
        Assert.NotNull(response.Headers.RetryAfter);
    }

    private sealed class SmallIpLimitFactory : ApiFactory
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            base.ConfigureWebHost(builder);
            builder.UseSetting("Auth:SignInLinks:PerIpPerHour", "3");
        }
    }
}
