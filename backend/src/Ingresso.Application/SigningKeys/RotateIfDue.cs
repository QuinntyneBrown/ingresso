using MediatR;
using Microsoft.EntityFrameworkCore;
using Ingresso.Application.Common.Interfaces;

namespace Ingresso.Application.SigningKeys;

/// <summary>
/// Rotates as <see cref="RotateSigningKeyCommand"/> does when a rotation interval is configured and the active key is
/// older than it; returns null when nothing was due (L2-140).
/// </summary>
public sealed record RotateIfDueCommand : IRequest<RotatedSigningKey?>;

public sealed class RotateIfDueCommandHandler(IAppDbContext db, IClock clock, SigningKeyPolicy policy, ISender sender)
    : IRequestHandler<RotateIfDueCommand, RotatedSigningKey?>
{
    public async Task<RotatedSigningKey?> Handle(RotateIfDueCommand request, CancellationToken cancellationToken)
    {
        if (policy.RotationInterval is not { } interval)
        {
            return null;
        }

        var due = clock.UtcNow - interval;
        var active = await db.SigningKeys.Where(k => k.RetiredAtUtc == null).ToListAsync(cancellationToken);
        return active.Count > 0 && active.All(k => k.CreatedAtUtc <= due)
            ? await sender.Send(new RotateSigningKeyCommand(Scheduled: true), cancellationToken)
            : null;
    }
}
