using System.Text.RegularExpressions;
using Microsoft.Data.Sqlite;
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

    // OpenIddict's stores delete a client's tokens with ExecuteDelete, which needs a relational provider,
    // so these tests run on in-memory SQLite rather than EF Core InMemory.
    private readonly SqliteConnection connection = new("Data Source=:memory:");
    private readonly ServiceProvider services;

    public ClientCommandsTests()
    {
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Clock:FixedUtcNow"] = "2026-11-02T14:00:00Z",
        }).Build();
        connection.Open();
        services = new ServiceCollection()
            .AddLogging()
            .AddDbContext<AppDbContext>(o => o.UseSqlite(connection))
            .AddApplication()
            .AddInfrastructureServices(configuration)
            .BuildServiceProvider();
        using var scope = services.CreateScope();
        scope.ServiceProvider.GetRequiredService<AppDbContext>().Database.EnsureCreated();
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
    // Traces to: L2-107
    // Description: clients add --offline-access allows the app the refresh token grant; without it the app has none.
    [Fact]
    public async Task Add_with_offline_access_allows_refresh_tokens()
    {
        var (code, output) = await Run("clients", "add", "--name", "Budget", "--redirect-uri", Redirect, "--offline-access");
        var (_, plain) = await Run("clients", "add", "--name", "Notes", "--redirect-uri", Redirect);

        Assert.Equal(0, code);
        await WithApplications(async manager =>
        {
            Assert.True(await manager.HasPermissionAsync((await manager.FindByClientIdAsync(ClientIdIn(output)))!, Permissions.GrantTypes.RefreshToken));
            Assert.False(await manager.HasPermissionAsync((await manager.FindByClientIdAsync(ClientIdIn(plain)))!, Permissions.GrantTypes.RefreshToken));
        });
    }

    // Acceptance Test
    // Traces to: L2-126
    // Description: clients add --first-party registers an app that skips consent, and clients list says so; without it the app asks.
    [Fact]
    public async Task Add_with_first_party_skips_consent()
    {
        var (code, output) = await Run("clients", "add", "--name", "Budget", "--redirect-uri", Redirect, "--first-party");
        var (_, plain) = await Run("clients", "add", "--name", "Notes", "--redirect-uri", Redirect);
        var (_, list) = await Run("clients", "list");

        Assert.Equal(0, code);
        await WithApplications(async manager =>
        {
            Assert.Equal(ConsentTypes.Implicit, await manager.GetConsentTypeAsync((await manager.FindByClientIdAsync(ClientIdIn(output)))!));
            Assert.Equal(ConsentTypes.Explicit, await manager.GetConsentTypeAsync((await manager.FindByClientIdAsync(ClientIdIn(plain)))!));
        });
        Assert.Contains("Budget\n  Client ID: " + ClientIdIn(output) + "\n  First-party: skips the consent page", list.Replace("\r\n", "\n"));
        Assert.DoesNotContain("Notes\n  Client ID: " + ClientIdIn(plain) + "\n  First-party", list.Replace("\r\n", "\n"));
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
    [InlineData("Sample app", null, "Add at least one redirect address.")]
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

    // Acceptance Test
    // Traces to: L2-089
    // Description: clients list prints each app's name, client ID and addresses, ordered by name.
    [Fact]
    public async Task List_prints_each_app_ordered_by_name()
    {
        var (_, notes) = await Run("clients", "add", "--name", "Notes", "--redirect-uri", "https://notes.example.com/signin-oidc");
        var (_, sample) = await Run(
            "clients", "add", "--name", "Budget", "--redirect-uri", Redirect, "--post-logout-redirect-uri", SignOutReturn);

        var (code, output) = await Run("clients", "list");

        Assert.Equal(0, code);
        Assert.Equal(
            $"""
            Budget
              Client ID: {ClientIdIn(sample)}
              Redirect: {Redirect}
              Sign-out return: {SignOutReturn}
            Notes
              Client ID: {ClientIdIn(notes)}
              Redirect: https://notes.example.com/signin-oidc

            """.ReplaceLineEndings(),
            output.ReplaceLineEndings());
    }

    // Acceptance Test
    // Traces to: L2-089
    // Description: With no registered apps, clients list says so and succeeds.
    [Fact]
    public async Task List_says_when_no_apps_are_registered()
    {
        var (code, output) = await Run("clients", "list");

        Assert.Equal(0, code);
        Assert.Contains("No apps are registered.", output);
    }

    // Acceptance Test
    // Traces to: L2-089
    // Description: clients remove removes the app with that client ID and prints its name.
    [Fact]
    public async Task Remove_removes_the_app_and_prints_its_name()
    {
        var (_, added) = await Run("clients", "add", "--name", "Sample app", "--redirect-uri", Redirect);

        var (code, output) = await Run("clients", "remove", "--client-id", ClientIdIn(added));

        Assert.Equal(0, code);
        Assert.Contains("Removed Sample app.", output);
        Assert.Equal(0, await ApplicationCount());
    }

    // Acceptance Test
    // Traces to: L2-089
    // Description: An unknown client ID changes nothing and fails with a message.
    [Fact]
    public async Task Remove_with_an_unknown_client_id_changes_nothing()
    {
        await Run("clients", "add", "--name", "Sample app", "--redirect-uri", Redirect);

        var (code, output) = await Run("clients", "remove", "--client-id", "unknown");

        Assert.Equal(1, code);
        Assert.Contains("No app has client ID 'unknown'.", output);
        Assert.Equal(1, await ApplicationCount());
    }

    // Acceptance Test
    // Traces to: L2-096
    // Description: clients add --scope allows the app a registered API scope, and clients list shows it.
    [Fact]
    public async Task Add_with_a_registered_scope_allows_it()
    {
        await Run("resources", "add", "--name", "Sample API", "--audience", "ingresso-sample-api", "--scope", "sample-api.read");

        var (code, added) = await Run("clients", "add", "--name", "Sample app", "--redirect-uri", Redirect, "--scope", "sample-api.read");

        Assert.Equal(0, code);
        await WithApplications(async manager =>
        {
            var app = await manager.FindByClientIdAsync(ClientIdIn(added));
            Assert.True(await manager.HasPermissionAsync(app!, Permissions.Prefixes.Scope + "sample-api.read"));
        });
        Assert.Contains("  Scope: sample-api.read", (await Run("clients", "list")).Output);
    }

    // Acceptance Test
    // Traces to: L2-096
    // Description: A scope no API has is refused, named in the output, and nothing is registered.
    [Fact]
    public async Task Add_with_an_unknown_scope_is_refused()
    {
        var (code, output) = await Run("clients", "add", "--name", "Notes", "--redirect-uri", Redirect, "--scope", "notes.write");

        Assert.Equal(1, code);
        Assert.Contains("No API has scope 'notes.write'.", output);
        Assert.Equal(0, await ApplicationCount());
    }

    // Acceptance Test
    // Traces to: L2-099
    // Description: clients add --front-channel-logout-uri stores the app's front-channel sign-out address, and clients list shows it.
    [Fact]
    public async Task Add_stores_the_front_channel_sign_out_address()
    {
        const string frontChannel = "https://localhost:5201/frontchannel-logout";

        var (code, _) = await Run("clients", "add", "--name", "Sample app", "--redirect-uri", Redirect, "--front-channel-logout-uri", frontChannel);

        Assert.Equal(0, code);
        Assert.Contains($"  Front-channel sign-out: {frontChannel}", (await Run("clients", "list")).Output);
    }

    // Acceptance Test
    // Traces to: L2-099, L2-088
    // Description: An unsafe front-channel sign-out address is refused, named in the output, and nothing is registered.
    [Fact]
    public async Task Add_refuses_an_unsafe_front_channel_sign_out_address()
    {
        var (code, output) = await Run(
            "clients", "add", "--name", "Sample app", "--redirect-uri", Redirect, "--front-channel-logout-uri", "http://example.com/logout");

        Assert.Equal(1, code);
        Assert.Contains("'http://example.com/logout'", output);
        Assert.Equal(0, await ApplicationCount());
    }

    // Acceptance Test
    // Traces to: L2-090
    // Description: Running seed again leaves registered apps unchanged.
    [Fact]
    public async Task Seed_keeps_registered_apps()
    {
        await Run("seed");
        await Run("clients", "add", "--name", "Sample app", "--redirect-uri", Redirect);
        var (_, before) = await Run("clients", "list");

        Assert.Equal(0, (await Run("seed")).Code);

        Assert.Equal(before, (await Run("clients", "list")).Output);
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

    public void Dispose()
    {
        services.Dispose();
        connection.Dispose();
    }
}
