using Ingresso.Application.Common.Interfaces;
using Ingresso.Domain.Entities;
using Ingresso.Domain.Enums;

namespace Ingresso.Application.Common;

public sealed class ActivityLog(IAppDbContext db, IClock clock, ICurrentUser user) : IActivityLog
{
    private const int SubjectLength = 200;

    public void Record(ActivityEventType type, Guid userId, string subject) =>
        db.ActivityEvents.Add(new ActivityEvent { UserId = userId, Type = type, Subject = Trim(subject), OccurredAtUtc = clock.UtcNow });

    public void RecordChange(ActivityEventType type, string subject) =>
        db.ActivityEvents.Add(new ActivityEvent { ActorId = user.UserId, Type = type, Subject = Trim(subject), OccurredAtUtc = clock.UtcNow });

    private static string Trim(string subject) => subject.Length <= SubjectLength ? subject : subject[..SubjectLength];
}
