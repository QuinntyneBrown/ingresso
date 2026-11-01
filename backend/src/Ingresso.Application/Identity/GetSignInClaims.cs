using MediatR;
using Microsoft.EntityFrameworkCore;
using Ingresso.Application.Common.Interfaces;

namespace Ingresso.Application.Identity;

/// <summary>What an app learns when a person signs in to it with ingresso (L2-092): their id and email, and whether it is verified.</summary>
public sealed record GetSignInClaimsQuery(Guid UserId) : IRequest<SignInClaims?>;

public sealed record SignInClaims(Guid UserId, string Email, bool EmailVerified);

public sealed class GetSignInClaimsQueryHandler(IAppDbContext db) : IRequestHandler<GetSignInClaimsQuery, SignInClaims?>
{
    public async Task<SignInClaims?> Handle(GetSignInClaimsQuery request, CancellationToken cancellationToken)
    {
        var user = await db.Users.AsNoTracking().Where(u => u.Id == request.UserId).Select(u => new { u.Id, u.Email }).SingleOrDefaultAsync(cancellationToken);
        if (user is null)
        {
            return null;
        }

        var email = user.Email.Trim().ToLowerInvariant();
        var verified = await db.VerifiedEmails.AnyAsync(v => v.NormalizedEmail == email, cancellationToken);
        return new SignInClaims(user.Id, user.Email, verified);
    }
}
