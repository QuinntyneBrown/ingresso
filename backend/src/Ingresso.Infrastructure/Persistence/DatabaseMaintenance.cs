using Microsoft.EntityFrameworkCore;
using Ingresso.Infrastructure.Seeding;

namespace Ingresso.Infrastructure.Persistence;

/// <summary>Migrate, seed and reset, used by the CLI. Relational providers (SQL Server and SQLite) apply migrations; only the in-memory test provider builds the schema from the model.</summary>
public sealed class DatabaseMaintenance(AppDbContext db, DatabaseSeeder seeder)
{
    public async Task MigrateAsync(CancellationToken cancellationToken = default)
    {
        if (!db.Database.IsRelational())
        {
            await db.Database.EnsureCreatedAsync(cancellationToken);
            return;
        }

        await db.Database.MigrateAsync(cancellationToken);
    }

    public Task SeedAsync(CancellationToken cancellationToken = default) => seeder.SeedAsync(cancellationToken);

    public async Task ResetAsync(CancellationToken cancellationToken = default)
    {
        await db.Database.EnsureDeletedAsync(cancellationToken);
        await MigrateAsync(cancellationToken);
        await SeedAsync(cancellationToken);
    }
}
