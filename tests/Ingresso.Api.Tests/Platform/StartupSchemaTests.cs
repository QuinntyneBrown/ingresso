using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Ingresso.Api.Tests.Infrastructure;
using Ingresso.Infrastructure.Persistence;

namespace Ingresso.Api.Tests.Platform;

public sealed class StartupSchemaTests : IDisposable
{
    private readonly string file = Path.Combine(Path.GetTempPath(), $"ingresso-api-{Guid.NewGuid():N}.db");

    private sealed class StartupFactory(string file, CapturingLoggerProvider logs) : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Testing");
            builder.UseSetting("Database:Provider", "Sqlite");
            builder.UseSetting("ConnectionStrings:Default", $"Data Source={file}");
            builder.UseSetting("Outbox:Enabled", "false");
            builder.ConfigureServices(s => s.AddLogging(b => b.AddProvider(logs).SetMinimumLevel(LogLevel.Debug)));
        }
    }

    private static int TableCount(string file)
    {
        using var connection = new SqliteConnection($"Data Source={file};Mode=ReadWriteCreate");
        connection.Open();
        using var command = connection.CreateCommand();
        command.CommandText = "select count(*) from sqlite_master where type = 'table'";
        return Convert.ToInt32(command.ExecuteScalar());
    }

    // Acceptance Test
    // Traces to: L2-050
    // Description: Starting the API against a database with pending migrations applies none of them and logs a warning.
    [Fact]
    public async Task Starting_with_pending_migrations_changes_no_schema_and_logs_a_warning()
    {
        var logs = new CapturingLoggerProvider();
        using (var factory = new StartupFactory(file, logs))
        {
            using var client = factory.CreateClient();
            await client.GetAsync("/health/live");
        }

        SqliteConnection.ClearAllPools();
        Assert.Equal(0, TableCount(file));
        Assert.Contains(logs.Entries, e => e.Level == LogLevel.Warning && e.Message.Contains("pending migration", StringComparison.OrdinalIgnoreCase));
    }

    // Acceptance Test
    // Traces to: L2-050
    // Description: Starting the API against a fully migrated database makes no schema change and logs no warning.
    [Fact]
    public async Task Starting_on_a_migrated_database_changes_nothing_and_logs_no_warning()
    {
        await Migrate();
        var before = TableCount(file);
        var logs = new CapturingLoggerProvider();
        using (var factory = new StartupFactory(file, logs))
        {
            using var client = factory.CreateClient();
            await client.GetAsync("/health/live");
        }

        SqliteConnection.ClearAllPools();
        Assert.Equal(before, TableCount(file));
        Assert.DoesNotContain(logs.Entries, e => e.Message.Contains("pending migration", StringComparison.OrdinalIgnoreCase));
    }

    private async Task Migrate()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>().UseSqlite($"Data Source={file}").ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning)).Options;
        await using var db = new AppDbContext(options);
        await db.Database.MigrateAsync();
    }

    public void Dispose()
    {
        SqliteConnection.ClearAllPools();
        if (File.Exists(file)) File.Delete(file);
    }
}
