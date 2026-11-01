using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Ingresso.Application;
using Ingresso.Infrastructure;
using Ingresso.Infrastructure.Persistence;

namespace Ingresso.Cli.Tests;

/// <summary>L2-136: the owner rotates and lists signing keys from the CLI.</summary>
public sealed class KeyCommandsTests : IDisposable
{
    // The Data Protection key ring lives in the database, so these tests run on in-memory SQLite like the CLI's own.
    private readonly SqliteConnection connection = new("Data Source=:memory:");
    private readonly ServiceProvider services;

    public KeyCommandsTests()
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
    // Traces to: L2-136
    // Description: keys rotate makes a new key active, makes the previous one retiring, and prints both ids.
    [Fact]
    public async Task Rotate_makes_a_new_key_active_and_the_previous_one_retiring()
    {
        await Run("keys", "rotate");
        var previous = await ActiveKidAsync();

        var (code, output) = await Run("keys", "rotate");

        Assert.Equal(0, code);
        var active = await ActiveKidAsync();
        Assert.NotEqual(previous, active);
        Assert.Equal(
            $"""
            Rotated the signing key.
            Active key: {active}
            Retiring key: {previous}, published until 2026-11-16 14:00 UTC
            A running API starts signing with the new key within a minute.

            """.ReplaceLineEndings(),
            output.ReplaceLineEndings());
    }

    // Acceptance Test
    // Traces to: L2-136
    // Description: keys with an unknown subcommand prints the usage and fails.
    [Fact]
    public async Task An_unknown_keys_command_prints_the_usage()
    {
        var (code, output) = await Run("keys", "shuffle");

        Assert.Equal(1, code);
        Assert.Contains("ingresso keys <rotate|list>", output);
    }

    private async Task<string> ActiveKidAsync()
    {
        using var scope = services.CreateScope();
        return await scope.ServiceProvider.GetRequiredService<AppDbContext>().SigningKeys.Where(k => k.RetiredAtUtc == null).Select(k => k.Kid).SingleAsync();
    }

    private async Task<(int Code, string Output)> Run(params string[] args)
    {
        var output = new StringWriter();
        var code = await CliApp.RunAsync(args, services, output);
        return (code, output.ToString());
    }

    public void Dispose()
    {
        services.Dispose();
        connection.Dispose();
    }
}
