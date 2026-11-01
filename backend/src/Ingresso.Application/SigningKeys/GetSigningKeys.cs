using MediatR;
using Microsoft.EntityFrameworkCore;
using Ingresso.Application.Common.Interfaces;
using Ingresso.Domain.Enums;

namespace Ingresso.Application.SigningKeys;

/// <summary>A signing key as <c>keys list</c> prints it; <see cref="PublishedUntil"/> is set while it is retiring (L2-136).</summary>
public sealed record SigningKeyDto(string Kid, SigningKeyState State, DateTimeOffset CreatedAt, DateTimeOffset? PublishedUntil);

/// <summary>The signing keys, active first, then newest first; creates the first key when there is none (L2-136).</summary>
public sealed record GetSigningKeysQuery : IRequest<IReadOnlyList<SigningKeyDto>>;

public sealed class GetSigningKeysQueryHandler(IAppDbContext db, ISigningKeyFactory keys, IClock clock, SigningKeyPolicy policy)
    : IRequestHandler<GetSigningKeysQuery, IReadOnlyList<SigningKeyDto>>
{
    public async Task<IReadOnlyList<SigningKeyDto>> Handle(GetSigningKeysQuery request, CancellationToken cancellationToken)
    {
        var now = clock.UtcNow;
        var stored = await db.SigningKeys.ToListAsync(cancellationToken);
        if (!stored.Any(k => k.RetiredAtUtc is null))
        {
            var first = keys.Create(now);
            db.SigningKeys.Add(first);
            await db.SaveChangesAsync(cancellationToken);
            stored.Add(first);
        }

        return stored
            .Select(k => (Key: k, State: k.State(now, policy.RetirementPeriod)))
            .OrderBy(k => k.State)
            .ThenByDescending(k => k.Key.CreatedAtUtc)
            .Select(k => new SigningKeyDto(
                k.Key.Kid, k.State, k.Key.CreatedAtUtc, k.State == SigningKeyState.Retiring ? k.Key.RetiredAtUtc + policy.RetirementPeriod : null))
            .ToList();
    }
}
