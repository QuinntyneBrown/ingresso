using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Ingresso.Api.Tests.Infrastructure;

namespace Ingresso.Api.Tests.Auth;

public sealed class DevOnlyEndpointsTests(DevOnlyEndpointsTests.ProductionFactory factory) : IClassFixture<DevOnlyEndpointsTests.ProductionFactory>
{
    // Acceptance Test
    // Traces to: L2-027
    // Description: Outside Development and the test host the dev mailbox and the test sign-in seam do not exist, whatever the configuration says.
    [Fact]
    public async Task The_dev_mailbox_and_test_sign_in_do_not_exist_in_production_even_when_configured_on()
    {
        var client = factory.CreateHttpsClient();

        var mailbox = await client.GetAsync("/api/dev/mailbox");
        var seam = await client.PostAsJsonAsync("/api/test/sign-in", new { email = HttpClientExtensions.DevUser });

        Assert.Contains(mailbox.StatusCode, new[] { HttpStatusCode.NotFound, HttpStatusCode.Unauthorized });
        Assert.Contains(seam.StatusCode, new[] { HttpStatusCode.NotFound, HttpStatusCode.Unauthorized });
        Assert.False(mailbox.Content.Headers.ContentLength > 2 && mailbox.IsSuccessStatusCode);
        Assert.False(seam.Headers.Contains("Set-Cookie"));
    }

    public sealed class ProductionFactory : ApiFactory
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            base.ConfigureWebHost(builder);
            builder.UseEnvironment("Production");
            builder.UseSetting("IdentityProvider:SigningCertificate:Path", TestSigningCertificate.Path);
        }
    }
}
