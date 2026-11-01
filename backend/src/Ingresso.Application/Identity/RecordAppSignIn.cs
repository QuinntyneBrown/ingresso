using MediatR;
using Microsoft.EntityFrameworkCore;
using Ingresso.Application.Common.Interfaces;
using Ingresso.Domain.Entities;
using Ingresso.Domain.Enums;

namespace Ingresso.Application.Identity;

/// <summary>
/// Records that an app signed in under this session, once, so signing out can notify it (L2-099), and adds it to the
/// person's activity (L2-141).
/// </summary>
public sealed record RecordAppSignInCommand(Guid SessionId, string ClientId) : IRequest;

public sealed class RecordAppSignInCommandHandler(IAppDbContext db, IClock clock, IConsentStore apps, IActivityLog activity)
    : IRequestHandler<RecordAppSignInCommand>
{
    public async Task Handle(RecordAppSignInCommand request, CancellationToken cancellationToken)
    {
        if (await db.SessionApps.AnyAsync(a => a.SessionId == request.SessionId && a.ClientId == request.ClientId, cancellationToken))
        {
            return;
        }

        db.SessionApps.Add(new SessionApp { SessionId = request.SessionId, ClientId = request.ClientId, SignedInAtUtc = clock.UtcNow });
        // Once per ingresso session and app, so renewals and repeat sign-ins don't flood the person's activity (L2-141).
        var userId = await db.Sessions.Where(s => s.Id == request.SessionId).Select(s => (Guid?)s.UserId).SingleOrDefaultAsync(cancellationToken);
        if (userId is { } person)
        {
            var app = await apps.FindAppAsync(request.ClientId, cancellationToken);
            activity.Record(ActivityEventType.SignedInToApp, person, app?.Name ?? request.ClientId);
        }

        await db.SaveChangesAsync(cancellationToken);
    }
}
