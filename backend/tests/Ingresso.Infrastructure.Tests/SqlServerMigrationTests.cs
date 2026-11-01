using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Ingresso.Infrastructure.Persistence;

namespace Ingresso.Infrastructure.Tests;

public sealed class SqlServerMigrationTests
{
    // Acceptance Test
    // Traces to: L2-049, L2-090
    // Description: Migrate creates the schema, including the OpenID Connect tables, and seed fills it on SQL Server.
    [SqlServerFact]
    [Trait("Category", "SqlServer")]
    public async Task Migrate_then_seed_works_on_sql_server()
    {
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["ConnectionStrings:Default"] = SqlServerFactAttribute.ConnectionString,
        }).Build();
        var services = new ServiceCollection().AddLogging().AddInfrastructure(configuration).BuildServiceProvider();
        using var scope = services.CreateScope();
        var maintenance = scope.ServiceProvider.GetRequiredService<DatabaseMaintenance>();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        try
        {
            await maintenance.MigrateAsync();
            await maintenance.SeedAsync();

            Assert.Empty(await db.Database.GetPendingMigrationsAsync());
            Assert.True(await db.Tiles.AnyAsync());
            var tables = await db.Database
                .SqlQueryRaw<string>("SELECT TABLE_NAME AS Value FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME LIKE 'OpenIddict%'")
                .ToListAsync();
            Assert.Equal(["OpenIddictApplications", "OpenIddictAuthorizations", "OpenIddictScopes", "OpenIddictTokens"], tables.Order());
        }
        finally
        {
            await db.Database.EnsureDeletedAsync();
        }
    }
}
