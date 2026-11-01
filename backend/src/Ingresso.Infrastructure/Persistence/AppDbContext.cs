using Microsoft.AspNetCore.DataProtection.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Ingresso.Application.Common.Interfaces;
using Ingresso.Domain.Entities;

namespace Ingresso.Infrastructure.Persistence;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options), IAppDbContext, IDataProtectionKeyContext
{
    public DbSet<Tile> Tiles => Set<Tile>();
    public DbSet<User> Users => Set<User>();
    public DbSet<OutboxMessage> OutboxMessages => Set<OutboxMessage>();
    public DbSet<SecurityToken> SecurityTokens => Set<SecurityToken>();
    public DbSet<VerifiedEmail> VerifiedEmails => Set<VerifiedEmail>();
    public DbSet<Session> Sessions => Set<Session>();
    public DbSet<SessionApp> SessionApps => Set<SessionApp>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<AuditEntry> AuditEntries => Set<AuditEntry>();
    public DbSet<SigningKey> SigningKeys => Set<SigningKey>();

    /// <summary>The Data Protection key ring, shared by the API and the CLI (ADR 0021).</summary>
    public DbSet<DataProtectionKey> DataProtectionKeys => Set<DataProtectionKey>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // OpenID Connect clients, authorizations, scopes and tokens (ADR 0014).
        modelBuilder.UseOpenIddict();

        // SQLite cannot compare or order DateTimeOffset values; store them as sortable binary
        // in tests and Playwright runs. SQL Server keeps its native datetimeoffset type.
        if (Database.IsSqlite())
        {
            foreach (var property in modelBuilder.Model.GetEntityTypes().SelectMany(t => t.GetProperties()))
            {
                if (property.ClrType == typeof(DateTimeOffset))
                {
                    property.SetValueConverter(new DateTimeOffsetToBinaryConverter());
                }
                else if (property.ClrType == typeof(DateTimeOffset?))
                {
                    property.SetValueConverter(new DateTimeOffsetToBinaryConverter());
                }
            }
        }
    }
}
