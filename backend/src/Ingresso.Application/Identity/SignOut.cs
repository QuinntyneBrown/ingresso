using MediatR;
using Microsoft.EntityFrameworkCore;
using Ingresso.Application.Common.Interfaces;

namespace Ingresso.Application.Identity;

/// <summary>Ends one session on the server, so its cookie no longer authenticates (L2-031).</summary>
public sealed record SignOutCommand(Guid SessionId) : IRequest;

public sealed class SignOutCommandHandler(IAppDbContext db, IClock clock) : IRequestHandler<SignOutCommand>
{
    public async Task Handle(SignOutCommand request, CancellationToken cancellationToken)
    {
        var session = await db.Sessions.SingleOrDefaultAsync(s => s.Id == request.SessionId, cancellationToken);
        if (session is { RevokedAtUtc: null })
        {
            session.RevokedAtUtc = clock.UtcNow;
            await db.SaveChangesAsync(cancellationToken);
        }
    }
}
