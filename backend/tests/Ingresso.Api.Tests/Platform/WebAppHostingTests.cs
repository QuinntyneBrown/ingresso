using System.Net;
using Microsoft.AspNetCore.Hosting;
using Ingresso.Api.Tests.Infrastructure;

namespace Ingresso.Api.Tests.Platform;

/// <summary>ADR 0023: the API serves the built web app from its own origin when a web root is present.</summary>
public sealed class WebAppHostingTests(WebAppHostingTests.WebRootFactory factory) : IClassFixture<WebAppHostingTests.WebRootFactory>
{
    [Theory]
    [InlineData("/")]
    [InlineData("/dashboard")]
    public async Task Pages_answer_with_the_web_app_shell(string path)
    {
        var response = await factory.CreateHttpsClient().GetAsync(path);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Contains("<ig-root>", await response.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task Unknown_api_paths_stay_not_found_instead_of_returning_the_shell()
    {
        var response = await factory.CreateHttpsClient().GetAsync("/api/does-not-exist");

        Assert.NotEqual(HttpStatusCode.OK, response.StatusCode);
        Assert.DoesNotContain("<ig-root>", await response.Content.ReadAsStringAsync());
    }

    public sealed class WebRootFactory : ApiFactory
    {
        private readonly string webRoot = Directory.CreateTempSubdirectory("ingresso-web").FullName;

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            File.WriteAllText(Path.Combine(webRoot, "index.html"), "<html><body><ig-root></ig-root></body></html>");
            builder.UseWebRoot(webRoot);
            base.ConfigureWebHost(builder);
        }
    }
}
