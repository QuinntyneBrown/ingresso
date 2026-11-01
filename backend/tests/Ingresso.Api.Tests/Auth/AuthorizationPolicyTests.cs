using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Ingresso.Api.Auth;
using Ingresso.Api.Tests.Infrastructure;

namespace Ingresso.Api.Tests.Auth;

/// <summary>L2-080: authorized endpoints need a session.</summary>
public sealed class AuthorizationPolicyTests(AuthorizationPolicyTests.Factory factory) : IClassFixture<AuthorizationPolicyTests.Factory>
{
    // Acceptance Test
    // Traces to: L2-033
    // Description: An anonymous caller to a protected endpoint gets 401.
    [Fact]
    public async Task Anonymous_caller_gets_401_from_an_authorized_endpoint()
    {
        var client = factory.CreateHttpsClient();

        var response = await client.GetAsync("/api/probe/authorized");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Signed_in_user_reaches_an_authorized_endpoint()
    {
        var client = factory.CreateHttpsClient();
        await client.SignInAsAsync(HttpClientExtensions.DevUser);

        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/probe/authorized")).StatusCode);
    }

    [Fact]
    public async Task Endpoint_without_an_attribute_is_closed_to_anonymous_callers()
    {
        var client = factory.CreateHttpsClient();

        var response = await client.GetAsync("/api/probe/unmarked");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // Acceptance Test
    // Traces to: L2-030
    // Description: The session cookie is HttpOnly, Secure and SameSite=Lax.
    [Fact]
    public async Task Session_cookie_is_secure_httponly_and_lax()
    {
        var client = factory.CreateHttpsClient();

        var response = await client.PostAsync("/api/test/sign-in", JsonContent.Create(new { email = HttpClientExtensions.DevUser }));

        var cookie = Assert.Single(response.Headers.GetValues("Set-Cookie"), c => c.StartsWith(AuthPolicies.SessionCookie, StringComparison.Ordinal));
        Assert.Contains("secure", cookie, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("httponly", cookie, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("samesite=lax", cookie, StringComparison.OrdinalIgnoreCase);
    }

    public sealed class Factory : ApiFactory
    {
        protected override void ConfigureTestServices(IServiceCollection services) =>
            services.AddControllers().AddApplicationPart(typeof(PolicyProbeController).Assembly);
    }
}

[ApiController]
[Route("api/probe")]
public sealed class PolicyProbeController : ControllerBase
{
    [HttpGet("authorized")]
    [Authorize]
    public IActionResult AuthorizedOnly() => Ok();

    [HttpGet("unmarked")]
    public IActionResult Unmarked() => Ok();
}
