using Ingresso.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Ingresso.Application.Common.Interfaces;

namespace Ingresso.Application.SigningKeys;

/// <summary>The new active key and the key it replaced, published until <see cref="PublishedUntil"/> (L2-136, L2-138).</summary>
public sealed record RotatedSigningKey(string ActiveKid, string? RetiringKid, DateTimeOffset? PublishedUntil);

/// <summary>Makes a new signing key active; the previous active key starts retiring (L2-136).</summary>
/// <summary><paramref name="Scheduled"/> when the configured schedule rotates, rather than the owner (L2-140, L2-143).</summary>
public sealed record RotateSigningKeyCommand(bool Scheduled = false) : IRequest<RotatedSigningKey>;

public sealed class RotateSigningKeyCommandHandler(
    IAppDbContext db, ISigningKeyFactory keys, IClock clock, SigningKeyPolicy policy, IActivityLog activity)
    : IRequestHandler<RotateSigningKeyCommand, RotatedSigningKey>
{
    public async Task<RotatedSigningKey> Handle(RotateSigningKeyCommand request, CancellationToken cancellationToken)
    {
        var now = clock.UtcNow;
        var previous = await db.SigningKeys.Where(k => k.RetiredAtUtc == null).ToListAsync(cancellationToken);
        foreach (var key in previous)
        {
            key.RetiredAtUtc = now;
        }

        var active = keys.Create(now);
        db.SigningKeys.Add(active);
        activity.RecordChange(ActivityEventType.SigningKeyRotated, request.Scheduled ? "scheduled" : "");
        await db.SaveChangesAsync(cancellationToken);
        var retiring = previous.OrderByDescending(k => k.CreatedAtUtc).FirstOrDefault();
        return new RotatedSigningKey(active.Kid, retiring?.Kid, retiring is null ? null : now + policy.RetirementPeriod);
    }
}
