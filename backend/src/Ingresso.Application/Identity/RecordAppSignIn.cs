using MediatR;
using Microsoft.EntityFrameworkCore;
using Ingresso.Application.Common.Interfaces;
using Ingresso.Domain.Entities;

namespace Ingresso.Application.Identity;

/// <summary>Records that an app signed in under this session, once, so signing out can notify it (L2-099).</summary>
public sealed record RecordAppSignInCommand(Guid SessionId, string ClientId) : IRequest;

public sealed class RecordAppSignInCommandHandler(IAppDbContext db, IClock clock) : IRequestHandler<RecordAppSignInCommand>
{
    public async Task Handle(RecordAppSignInCommand request, CancellationToken cancellationToken)
    {
        if (await db.SessionApps.AnyAsync(a => a.SessionId == request.SessionId && a.ClientId == request.ClientId, cancellationToken))
        {
            return;
        }

        db.SessionApps.Add(new SessionApp { SessionId = request.SessionId, ClientId = request.ClientId, SignedInAtUtc = clock.UtcNow });
        await db.SaveChangesAsync(cancellationToken);
    }
}
