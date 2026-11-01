using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Ingresso.Infrastructure.Persistence;

namespace Ingresso.Infrastructure.Tests;

public sealed class DatabaseMaintenanceTests : IDisposable
{
    private readonly string file = Path.Combine(Path.GetTempPath(), $"ingresso-{Guid.NewGuid():N}.db");

    private ServiceProvider Services()
    {
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Database:Provider"] = "Sqlite",
            ["ConnectionStrings:Default"] = $"Data Source={file}",
        }).Build();
        return new ServiceCollection().AddLogging().AddInfrastructure(configuration).BuildServiceProvider();
    }

    // Acceptance Test
    // Traces to: L2-049
    // Description: Migrate applies the EF Core migrations on SQLite, leaves none pending, and is safe to run again.
    [Fact]
    public async Task Migrate_applies_the_migrations_on_sqlite_and_can_be_rerun()
    {
        using var services = Services();
        using var scope = services.CreateScope();
        var maintenance = scope.ServiceProvider.GetRequiredService<DatabaseMaintenance>();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        await maintenance.MigrateAsync();
        await maintenance.MigrateAsync();

        Assert.NotEmpty(await db.Database.GetAppliedMigrationsAsync());
        Assert.Empty(await db.Database.GetPendingMigrationsAsync());
    }

    public void Dispose()
    {
        Microsoft.Data.Sqlite.SqliteConnection.ClearAllPools();
        if (File.Exists(file)) File.Delete(file);
    }
}
