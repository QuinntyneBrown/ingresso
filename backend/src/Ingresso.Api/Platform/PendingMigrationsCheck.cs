using Microsoft.EntityFrameworkCore;
using Ingresso.Infrastructure.Persistence;

namespace Ingresso.Api.Platform;

/// <summary>
/// Reads, never writes, the migration state at startup (L2-050): the API does not change the schema, so
/// pending migrations are reported as a warning and the CLI <c>migrate</c> command applies them.
/// </summary>
public static class PendingMigrationsCheck
{
    public static async Task WarnIfPendingAsync(this WebApplication app)
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var logger = app.Services.GetRequiredService<ILoggerFactory>().CreateLogger("Ingresso.Startup");
        try
        {
            if (!db.Database.IsRelational())
            {
                return;
            }

            var pending = (await db.Database.GetPendingMigrationsAsync()).ToList();
            if (pending.Count > 0)
            {
                logger.LogWarning("The database has {Count} pending migration(s) ({Names}). The API does not apply them; run the CLI migrate command.", pending.Count, string.Join(", ", pending));
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Could not read the migration state at startup; the database may be unreachable.");
        }
    }
}
