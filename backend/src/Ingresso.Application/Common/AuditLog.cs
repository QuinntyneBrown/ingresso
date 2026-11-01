using Ingresso.Application.Common.Interfaces;
using Ingresso.Domain.Entities;

namespace Ingresso.Application.Common;

public sealed class AuditLog(IAppDbContext db, IClock clock, ICurrentUser user) : IAuditLog
{
    public void Record(string action, string targetType, Guid targetId) =>
        db.AuditEntries.Add(new AuditEntry
        {
            ActorId = user.UserId,
            Action = action,
            TargetType = targetType,
            TargetId = targetId,
            OccurredAtUtc = clock.UtcNow,
        });
}
