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

    // Acceptance Test
    // Traces to: L2-139
    // Description: On a migrated SQLite database the first signing key is created, encrypted with a Data Protection key the database keeps.
    [Fact]
    public async Task Migrate_lets_the_signing_keys_and_their_data_protection_key_be_stored_on_sqlite()
    {
        using var services = Services();
        using (var scope = services.CreateScope())
        {
            await scope.ServiceProvider.GetRequiredService<DatabaseMaintenance>().MigrateAsync();
        }

        var ring = services.GetRequiredService<Ingresso.Infrastructure.Identity.SigningKeyRing>();
        await ring.ReloadAsync(CancellationToken.None);

        using var check = services.CreateScope();
        var db = check.ServiceProvider.GetRequiredService<AppDbContext>();
        Assert.Equal(ring.Keys.Single().KeyId, (await db.SigningKeys.SingleAsync()).Kid);
        Assert.NotEmpty(await db.DataProtectionKeys.ToListAsync());
    }

    // Acceptance Test
    // Traces to: L2-090
    // Description: Migrate creates the OpenID Connect client, authorization, scope and token tables on SQLite.
    [Fact]
    public async Task Migrate_creates_the_openid_connect_tables_on_sqlite()
    {
        using var services = Services();
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        await scope.ServiceProvider.GetRequiredService<DatabaseMaintenance>().MigrateAsync();

        var tables = await db.Database
            .SqlQueryRaw<string>("SELECT name AS Value FROM sqlite_master WHERE type = 'table' AND name LIKE 'OpenIddict%'")
            .ToListAsync();
        Assert.Equal(["OpenIddictApplications", "OpenIddictAuthorizations", "OpenIddictScopes", "OpenIddictTokens"], tables.Order());
    }

    public void Dispose()
    {
        Microsoft.Data.Sqlite.SqliteConnection.ClearAllPools();
        if (File.Exists(file)) File.Delete(file);
    }
}
