using MediatR;
using Microsoft.EntityFrameworkCore;
using Ingresso.Application.Common.Interfaces;

namespace Ingresso.Application.Activity;

/// <summary>Deletes events older than the retention period and returns how many (L2-145).</summary>
public sealed record PruneActivityCommand : IRequest<int>;

/// <summary>How long security events are kept: <c>Activity:RetentionPeriod</c>, 90 days by default (L2-145).</summary>
public sealed record ActivityRetention(TimeSpan Period)
{
    public static readonly TimeSpan Default = TimeSpan.FromDays(90);
}

public sealed class PruneActivityCommandHandler(IAppDbContext db, IClock clock, ActivityRetention retention)
    : IRequestHandler<PruneActivityCommand, int>
{
    public async Task<int> Handle(PruneActivityCommand request, CancellationToken cancellationToken)
    {
        var threshold = clock.UtcNow - retention.Period;
        var old = await db.ActivityEvents.Where(e => e.OccurredAtUtc < threshold).ToListAsync(cancellationToken);
        db.ActivityEvents.RemoveRange(old);
        await db.SaveChangesAsync(cancellationToken);
        return old.Count;
    }
}
