using Microsoft.EntityFrameworkCore;
using Ingresso.Domain.Entities;

namespace Ingresso.Application.Common.Interfaces;

public interface IAppDbContext
{
    DbSet<Tile> Tiles { get; }
    DbSet<User> Users { get; }
    DbSet<OutboxMessage> OutboxMessages { get; }
    DbSet<SecurityToken> SecurityTokens { get; }
    DbSet<VerifiedEmail> VerifiedEmails { get; }
    DbSet<Session> Sessions { get; }
    DbSet<SessionApp> SessionApps { get; }
    DbSet<Notification> Notifications { get; }
    DbSet<AuditEntry> AuditEntries { get; }
    DbSet<SigningKey> SigningKeys { get; }
    DbSet<ActivityEvent> ActivityEvents { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
