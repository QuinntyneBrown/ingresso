using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Ingresso.Infrastructure;
using Ingresso.Infrastructure.Persistence;

namespace Ingresso.Cli.Tests;

public sealed class CliAppTests : IDisposable
{
    private readonly ServiceProvider services;

    public CliAppTests()
    {
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Clock:FixedUtcNow"] = "2026-11-02T14:00:00Z",
        }).Build();
        var databaseName = Guid.NewGuid().ToString();
        services = new ServiceCollection()
            .AddLogging()
            .AddDbContext<AppDbContext>(o => o.UseInMemoryDatabase(databaseName))
            .AddInfrastructureServices(configuration)
            .BuildServiceProvider();
    }

    [Fact]
    public async Task Seed_fills_the_database_and_is_safe_to_rerun()
    {
        var output = new StringWriter();

        Assert.Equal(0, await CliApp.RunAsync(["seed"], services, output));
        var first = await TileCount();
        Assert.Equal(0, await CliApp.RunAsync(["seed"], services, output));

        Assert.True(first > 0);
        Assert.Equal(first, await TileCount());
        Assert.Contains("Database seeded.", output.ToString());
    }

    [Fact]
    public async Task Reset_recreates_and_seeds_the_database()
    {
        var output = new StringWriter();

        Assert.Equal(0, await CliApp.RunAsync(["reset", "--confirm"], services, output));

        Assert.True(await TileCount() > 0);
    }

    // Acceptance Test
    // Traces to: L2-049
    // Description: Reset deletes data, so it refuses to run without the explicit confirmation flag.
    [Fact]
    public async Task Reset_without_the_confirmation_flag_changes_nothing_and_fails()
    {
        var output = new StringWriter();
        await CliApp.RunAsync(["seed"], services, output);
        var before = await TileCount();

        var code = await CliApp.RunAsync(["reset"], services, output);

        Assert.Equal(1, code);
        Assert.Contains("--confirm", output.ToString());
        Assert.Equal(before, await TileCount());
    }

    // Acceptance Test
    // Traces to: L2-049
    // Description: A failing command exits non-zero with a message instead of throwing.
    [Fact]
    public async Task A_failing_command_exits_non_zero_with_a_message()
    {
        var output = new StringWriter();
        var broken = new ServiceCollection().AddLogging().BuildServiceProvider();

        var code = await CliApp.RunAsync(["migrate"], broken, output);

        Assert.Equal(1, code);
        Assert.Contains("failed", output.ToString(), StringComparison.OrdinalIgnoreCase);
    }

    [Theory]
    [InlineData]
    [InlineData("drop-everything")]
    public async Task Unknown_or_missing_command_prints_usage_and_fails(params string[] args)
    {
        var output = new StringWriter();

        Assert.Equal(1, await CliApp.RunAsync(args, services, output));
        Assert.Contains(CliApp.Usage, output.ToString());
    }

    private async Task<int> TileCount()
    {
        using var scope = services.CreateScope();
        return await scope.ServiceProvider.GetRequiredService<AppDbContext>().Tiles.CountAsync();
    }

    public void Dispose() => services.Dispose();
}
