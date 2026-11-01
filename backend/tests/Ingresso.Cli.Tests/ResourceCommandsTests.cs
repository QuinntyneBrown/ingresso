using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using OpenIddict.Abstractions;
using Ingresso.Application;
using Ingresso.Infrastructure;
using Ingresso.Infrastructure.Persistence;

namespace Ingresso.Cli.Tests;

public sealed class ResourceCommandsTests : IDisposable
{
    // OpenIddict's stores need a relational provider, so these tests run on in-memory SQLite.
    private readonly SqliteConnection connection = new("Data Source=:memory:");
    private readonly ServiceProvider services;

    public ResourceCommandsTests()
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
    // Traces to: L2-095
    // Description: resources add registers an API with its scopes, each tied to its audience, and prints them.
    [Fact]
    public async Task Add_registers_the_api_and_its_scopes()
    {
        var (code, output) = await Run(
            "resources", "add", "--name", "Sample API", "--audience", "ingresso-sample-api", "--scope", "sample-api.read", "--scope", "sample-api.write");

        Assert.Equal(0, code);
        Assert.Equal(
            """
            Registered Sample API.
            Audience: ingresso-sample-api
            Scope: sample-api.read
            Scope: sample-api.write

            """.ReplaceLineEndings(),
            output.ReplaceLineEndings());
        using var scope = services.CreateScope();
        var scopes = scope.ServiceProvider.GetRequiredService<IOpenIddictScopeManager>();
        var resources = new List<string>();
        await foreach (var resource in scopes.ListResourcesAsync(["sample-api.read", "sample-api.write"]))
        {
            resources.Add(resource);
        }

        Assert.Equal(["ingresso-sample-api"], resources.Distinct());
    }

    // Acceptance Test
    // Traces to: L2-095
    // Description: A taken audience or scope, an empty name, no scope, a value with spaces or a reserved scope is refused with the reason.
    [Theory]
    [InlineData("Other API", "ingresso-sample-api", "other.read", "An API with audience 'ingresso-sample-api' is already registered.")]
    [InlineData("Other API", "other-api", "sample-api.read", "The scope 'sample-api.read' is already registered.")]
    [InlineData("", "other-api", "other.read", "Enter a name for the API.")]
    [InlineData("Other API", "other-api", null, "Add at least one --scope.")]
    [InlineData("Other API", "other api", "other.read", "The audience 'other api' must not contain spaces.")]
    [InlineData("Other API", "other-api", "other read", "The scope 'other read' must not contain spaces.")]
    [InlineData("Other API", "other-api", "openid", "The scope 'openid' is reserved by ingresso.")]
    public async Task Add_refuses_a_taken_or_invalid_api(string name, string audience, string? scope, string reason)
    {
        await Run("resources", "add", "--name", "Sample API", "--audience", "ingresso-sample-api", "--scope", "sample-api.read");
        string[] args = scope is null
            ? ["resources", "add", "--name", name, "--audience", audience]
            : ["resources", "add", "--name", name, "--audience", audience, "--scope", scope];

        var (code, output) = await Run(args);

        Assert.Equal(1, code);
        Assert.Contains(reason, output);
        Assert.Equal(1, await ScopeCount());
    }

    // Acceptance Test
    // Traces to: L2-095
    // Description: resources list prints each API's name, audience and scopes, ordered by name, or that there are none.
    [Fact]
    public async Task List_prints_each_api_ordered_by_name()
    {
        Assert.Contains("No APIs are registered.", (await Run("resources", "list")).Output);
        await Run("resources", "add", "--name", "Sample API", "--audience", "ingresso-sample-api", "--scope", "sample-api.read");
        await Run("resources", "add", "--name", "Budget API", "--audience", "budget-api", "--scope", "budget.read", "--scope", "budget.write");

        var (code, output) = await Run("resources", "list");

        Assert.Equal(0, code);
        Assert.Equal(
            """
            Budget API
              Audience: budget-api
              Scope: budget.read
              Scope: budget.write
            Sample API
              Audience: ingresso-sample-api
              Scope: sample-api.read

            """.ReplaceLineEndings(),
            output.ReplaceLineEndings());
    }

    // Acceptance Test
    // Traces to: L2-095
    // Description: resources remove removes the API and its scopes by audience; an unknown audience changes nothing.
    [Fact]
    public async Task Remove_removes_the_api_by_audience()
    {
        await Run("resources", "add", "--name", "Sample API", "--audience", "ingresso-sample-api", "--scope", "sample-api.read", "--scope", "sample-api.write");

        var unknown = await Run("resources", "remove", "--audience", "unknown");
        Assert.Equal(1, unknown.Code);
        Assert.Contains("No API has audience 'unknown'.", unknown.Output);
        Assert.Equal(2, await ScopeCount());

        var (code, output) = await Run("resources", "remove", "--audience", "ingresso-sample-api");

        Assert.Equal(0, code);
        Assert.Contains("Removed Sample API.", output);
        Assert.Equal(0, await ScopeCount());
    }

    private async Task<(int Code, string Output)> Run(params string[] args)
    {
        var output = new StringWriter();
        var code = await CliApp.RunAsync(args, services, output);
        return (code, output.ToString());
    }

    private async Task<long> ScopeCount()
    {
        using var scope = services.CreateScope();
        return await scope.ServiceProvider.GetRequiredService<IOpenIddictScopeManager>().CountAsync();
    }

    public void Dispose()
    {
        services.Dispose();
        connection.Dispose();
    }
}
