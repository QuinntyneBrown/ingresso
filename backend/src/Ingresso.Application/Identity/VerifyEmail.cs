using MediatR;
using Microsoft.EntityFrameworkCore;
using Ingresso.Application.Common.Interfaces;
using Ingresso.Domain.Entities;
using Ingresso.Domain.Enums;

namespace Ingresso.Application.Identity;

/// <summary>Redeems a verification link; returns false for an unknown, used or expired one.</summary>
public sealed record VerifyEmailCommand(string Token) : IRequest<bool>;

/// <summary>
/// Marks the address verified.
/// </summary>
public sealed class VerifyEmailCommandHandler(IAppDbContext db, IClock clock, ISecurityTokenService tokens) : IRequestHandler<VerifyEmailCommand, bool>
{
    public async Task<bool> Handle(VerifyEmailCommand request, CancellationToken cancellationToken)
    {
        var now = clock.UtcNow;
        var hash = tokens.Hash(request.Token);
        var token = await db.SecurityTokens.SingleOrDefaultAsync(t => t.TokenHash == hash && t.Purpose == SecurityTokenPurpose.VerifyEmail, cancellationToken);
        if (token is null || !token.IsUsable(now))
        {
            return false;
        }

        token.UsedAtUtc = now;
        if (!await db.VerifiedEmails.AnyAsync(v => v.NormalizedEmail == token.Email, cancellationToken))
        {
            db.VerifiedEmails.Add(new VerifiedEmail { NormalizedEmail = token.Email, VerifiedAtUtc = now });
        }

        await db.SaveChangesAsync(cancellationToken);
        return true;
    }
}
