using MediatR;
using Microsoft.EntityFrameworkCore;
using Ingresso.Application.Common.Interfaces;

namespace Ingresso.Application.Identity;

/// <summary>What the signed-in header needs (L2-050), and whether the address is verified (L2-029). Unread notifications arrive with journey 21.</summary>
public sealed record CurrentUserDto(string Name, string Email, string Initials, string Role, int UnreadNotificationCount, bool EmailVerified);

public sealed record GetCurrentUserQuery : IRequest<CurrentUserDto?>;

public sealed class GetCurrentUserQueryHandler(IAppDbContext db, ICurrentUser current) : IRequestHandler<GetCurrentUserQuery, CurrentUserDto?>
{
    public async Task<CurrentUserDto?> Handle(GetCurrentUserQuery request, CancellationToken cancellationToken)
    {
        if (current.UserId is not { } id)
        {
            return null;
        }

        var user = await db.Users.AsNoTracking().SingleOrDefaultAsync(u => u.Id == id, cancellationToken);
        if (user is null)
        {
            return null;
        }

        var email = user.Email.Trim().ToLowerInvariant();
        var verified = await db.VerifiedEmails.AnyAsync(v => v.NormalizedEmail == email, cancellationToken);
        return new CurrentUserDto(user.Name ?? user.Email, user.Email, user.Initials, user.Role.ToString().ToLowerInvariant(), 0, verified);
    }
}
