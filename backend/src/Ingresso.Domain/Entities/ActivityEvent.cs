using Ingresso.Domain.Enums;

namespace Ingresso.Domain.Entities;

/// <summary>
/// One security event (L2-141, ADR 0022). <see cref="UserId"/> is whose activity it is; app and key changes have none and
/// name the administrator who made them in <see cref="ActorId"/> (none from the CLI or the schedule). <see cref="Subject"/>
/// is what a person recognises: an app's name or a device description. Never a token, secret, code, tile address or IP
/// address (L2-038).
/// </summary>
public class ActivityEvent
{
    /// <summary>A database sequence, so events order newest first even when two share a time.</summary>
    public long Id { get; set; }

    public Guid? UserId { get; set; }
    public Guid? ActorId { get; set; }
    public ActivityEventType Type { get; set; }
    public string Subject { get; set; } = "";
    public DateTimeOffset OccurredAtUtc { get; set; }
}
