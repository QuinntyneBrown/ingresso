using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using OpenIddict.Abstractions;
using Ingresso.Application;
using Ingresso.Infrastructure;
using Ingresso.Infrastructure.Persistence;
using static OpenIddict.Abstractions.OpenIddictConstants;

namespace Ingresso.Cli.Tests;

public sealed partial class ClientCommandsTests : IDisposable
{
    private const string Redirect = "https://localhost:5201/signin-oidc";
    private const string SignOutReturn = "https://localhost:5201/signout-callback-oidc";

    private readonly ServiceProvider services;

    public ClientCommandsTests()
    {
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Clock:FixedUtcNow"] = "2026-11-02T14:00:00Z",
        }).Build();
        var databaseName = Guid.NewGuid().ToString();
        services = new ServiceCollection()
            .AddLogging()
            .AddDbContext<AppDbContext>(o => o.UseInMemoryDatabase(databaseName))
            .AddApplication()
            .AddInfrastructureServices(configuration)
            .BuildServiceProvider();
    }

    // Acceptance Test
    // Traces to: L2-087
    // Description: clients add registers a public client that must use PKCE and prints its client ID.
    [Fact]
    public async Task Add_registers_a_public_pkce_client_and_prints_its_client_id()
    {
        var (code, output) = await Run("clients", "add", "--name", "Sample app", "--redirect-uri", Redirect);

        Assert.Equal(0, code);
        Assert.Contains("Registered Sample app.", output);
        var clientId = ClientIdIn(output);
        await WithApplications(async manager =>
        {
            var app = await manager.FindByClientIdAsync(clientId);
            Assert.NotNull(app);
            Assert.Equal("Sample app", await manager.GetDisplayNameAsync(app));
            Assert.Equal(ClientTypes.Public, await manager.GetClientTypeAsync(app));
            Assert.Equal([Redirect], (await manager.GetRedirectUrisAsync(app)).ToArray());
            Assert.True(await manager.HasRequirementAsync(app, Requirements.Features.ProofKeyForCodeExchange));
            Assert.True(await manager.HasPermissionAsync(app, Permissions.GrantTypes.AuthorizationCode));
        });
    }

    // Acceptance Test
    // Traces to: L2-087
    // Description: Sign-out return addresses given to clients add are stored with the app.
    [Fact]
    public async Task Add_stores_the_sign_out_return_addresses()
    {
        var (code, output) = await Run(
            "clients", "add", "--name", "Sample app", "--redirect-uri", Redirect, "--post-logout-redirect-uri", SignOutReturn);

        Assert.Equal(0, code);
        await WithApplications(async manager =>
        {
            var app = await manager.FindByClientIdAsync(ClientIdIn(output));
            Assert.Equal([SignOutReturn], (await manager.GetPostLogoutRedirectUrisAsync(app!)).ToArray());
        });
    }

    // Acceptance Test
    // Traces to: L2-087
    // Description: A name already registered, ignoring case, is refused and nothing is registered.
    [Fact]
    public async Task Add_refuses_a_name_already_registered()
    {
        await Run("clients", "add", "--name", "Sample app", "--redirect-uri", Redirect);

        var (code, output) = await Run("clients", "add", "--name", "SAMPLE APP", "--redirect-uri", Redirect);

        Assert.Equal(1, code);
        Assert.Contains("An app named 'SAMPLE APP' is already registered.", output);
        Assert.Equal(1, await ApplicationCount());
    }

    // Acceptance Test
    // Traces to: L2-088
    // Description: Unsafe or inexact addresses are refused, named in the output, and nothing is registered.
    [Theory]
    [InlineData("http://notes.example.com/callback")]
    [InlineData("/signin-oidc")]
    [InlineData("ftp://localhost/callback")]
    [InlineData("https://localhost:5201/signin-oidc#done")]
    [InlineData("https://*.example.com/signin-oidc")]
    public async Task Add_refuses_an_unsafe_redirect_address(string address)
    {
        var (code, output) = await Run("clients", "add", "--name", "Sample app", "--redirect-uri", address);

        Assert.Equal(1, code);
        Assert.Contains($"'{address}'", output);
        Assert.Equal(0, await ApplicationCount());
    }

    // Acceptance Test
    // Traces to: L2-088
    // Description: An unsafe sign-out return address is refused too.
    [Fact]
    public async Task Add_refuses_an_unsafe_sign_out_return_address()
    {
        var (code, output) = await Run(
            "clients", "add", "--name", "Sample app", "--redirect-uri", Redirect, "--post-logout-redirect-uri", "http://example.com/out");

        Assert.Equal(1, code);
        Assert.Contains("'http://example.com/out'", output);
        Assert.Equal(0, await ApplicationCount());
    }

    // Acceptance Test
    // Traces to: L2-088
    // Description: http is allowed for loopback hosts only, so local development apps can register.
    [Theory]
    [InlineData("http://localhost:5201/signin-oidc")]
    [InlineData("http://127.0.0.1:5201/signin-oidc")]
    [InlineData("http://[::1]:5201/signin-oidc")]
    public async Task Add_allows_http_for_loopback_addresses(string address)
    {
        var (code, _) = await Run("clients", "add", "--name", "Local app", "--redirect-uri", address);

        Assert.Equal(0, code);
        Assert.Equal(1, await ApplicationCount());
    }

    // Acceptance Test
    // Traces to: L2-088
    // Description: A missing redirect address, an empty name or a name over 100 characters is refused with the reason.
    [Theory]
    [InlineData("Sample app", null, "Add at least one --redirect-uri.")]
    [InlineData("", Redirect, "Enter a name for the app.")]
    [InlineData("x", Redirect, "The name must be 100 characters or fewer.")]
    public async Task Add_refuses_a_missing_address_or_a_bad_name(string name, string? redirect, string reason)
    {
        if (name == "x") name = new string('x', 101);
        string[] args = redirect is null
            ? ["clients", "add", "--name", name]
            : ["clients", "add", "--name", name, "--redirect-uri", redirect];

        var (code, output) = await Run(args);

        Assert.Equal(1, code);
        Assert.Contains(reason, output);
        Assert.Equal(0, await ApplicationCount());
    }

    private async Task<(int Code, string Output)> Run(params string[] args)
    {
        var output = new StringWriter();
        var code = await CliApp.RunAsync(args, services, output);
        return (code, output.ToString());
    }

    private static string ClientIdIn(string output) => ClientIdPattern().Match(output).Groups[1].Value;

    private async Task WithApplications(Func<IOpenIddictApplicationManager, Task> action)
    {
        using var scope = services.CreateScope();
        await action(scope.ServiceProvider.GetRequiredService<IOpenIddictApplicationManager>());
    }

    private async Task<long> ApplicationCount()
    {
        using var scope = services.CreateScope();
        return await scope.ServiceProvider.GetRequiredService<IOpenIddictApplicationManager>().CountAsync();
    }

    [GeneratedRegex(@"Client ID: ([0-9a-f]{32})")]
    private static partial Regex ClientIdPattern();

    public void Dispose() => services.Dispose();
}
