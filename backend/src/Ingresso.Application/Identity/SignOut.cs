using MediatR;
using Microsoft.EntityFrameworkCore;
using Ingresso.Application.Common.Interfaces;

namespace Ingresso.Application.Identity;

/// <summary>
/// Ends one session on the server, so its cookie no longer authenticates (L2-031), and returns a signed-out ticket
/// naming the apps that signed in under it and have a front-channel sign-out address, and <paramref name="ReturnUrl"/>
/// when an app started the sign-out (L2-100, L2-101). Null when there is nothing for the signed-out page to do.
/// </summary>
public sealed record SignOutCommand(Guid SessionId, string? ReturnUrl = null) : IRequest<string?>;

public sealed class SignOutCommandHandler(IAppDbContext db, IClock clock, IClientRegistry clients, ISignOutTickets tickets)
    : IRequestHandler<SignOutCommand, string?>
{
    public async Task<string?> Handle(SignOutCommand request, CancellationToken cancellationToken)
    {
        var session = await db.Sessions.SingleOrDefaultAsync(s => s.Id == request.SessionId, cancellationToken);
        if (session is { RevokedAtUtc: null })
        {
            session.RevokedAtUtc = clock.UtcNow;
            await db.SaveChangesAsync(cancellationToken);
        }

        var signedIn = await db.SessionApps.Where(a => a.SessionId == request.SessionId).Select(a => a.ClientId).ToListAsync(cancellationToken);
        var notify = signedIn.Count == 0
            ? []
            : (await clients.ListAsync(cancellationToken))
                .Where(c => c.FrontChannelLogoutUri is not null && signedIn.Contains(c.ClientId))
                .Select(c => c.ClientId)
                .ToList();
        return notify.Count == 0 && request.ReturnUrl is null
            ? null
            : tickets.Protect(new SignOutTicket(request.SessionId, notify, request.ReturnUrl, clock.UtcNow));
    }
}
