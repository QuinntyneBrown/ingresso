using Ingresso.Domain.Enums;

namespace Ingresso.Application.Common.Interfaces;

/// <summary>
/// Records security events in the current unit of work: the handler's own SaveChanges saves an event with the change it
/// records (L2-141, ADR 0022).
/// </summary>
public interface IActivityLog
{
    /// <summary>An event in <paramref name="userId"/>'s activity.</summary>
    void Record(ActivityEventType type, Guid userId, string subject);

    /// <summary>An app or key change, made by the current user, or by no one from the CLI or the schedule (L2-143).</summary>
    void RecordChange(ActivityEventType type, string subject);
}
