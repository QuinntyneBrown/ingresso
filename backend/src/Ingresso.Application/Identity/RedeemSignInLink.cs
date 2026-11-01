using MediatR;
using Microsoft.EntityFrameworkCore;
using Ingresso.Application.Common.Interfaces;
using Ingresso.Domain.Entities;
using Ingresso.Domain.Enums;

namespace Ingresso.Application.Identity;

/// <summary>The signed-in identity to put in the cookie, and where to send the browser.</summary>
public sealed record SignedIn(Guid SessionId, Guid UserId, string Email, string Name, UserRole Role, string RedirectTo);

/// <summary>Why a sign-in link was refused. A tampered or unknown token is <see cref="Invalid"/>, which says nothing more (L2-028).</summary>
public enum LinkFailure
{
    Invalid,
    Used,
    Expired,
}

/// <summary>Either a session to start or the reason the link was refused.</summary>
public sealed record RedeemResult(SignedIn? SignedIn, LinkFailure? Failure);

/// <summary>Redeems a sign-in link (L2-028).</summary>
public sealed record RedeemSignInLinkCommand(string Token, string? UserAgent = null) : IRequest<RedeemResult>;

/// <summary>
/// Marks the token used, finds or creates the user, verifies their address and starts a session, all in one unit of
/// work, so a token can start at most one session.
/// </summary>
public sealed class RedeemSignInLinkCommandHandler(IAppDbContext db, IClock clock, ISecurityTokenService tokens, IActivityLog activity)
    : IRequestHandler<RedeemSignInLinkCommand, RedeemResult>
{
    public async Task<RedeemResult> Handle(RedeemSignInLinkCommand request, CancellationToken cancellationToken)
    {
        var now = clock.UtcNow;
        var hash = tokens.Hash(request.Token);
        var token = await db.SecurityTokens.SingleOrDefaultAsync(t => t.TokenHash == hash && t.Purpose == SecurityTokenPurpose.SignIn, cancellationToken);
        if (token is null)
        {
            return new RedeemResult(null, LinkFailure.Invalid);
        }

        if (token.UsedAtUtc is not null)
        {
            return new RedeemResult(null, LinkFailure.Used);
        }

        if (!token.IsUsable(now))
        {
            return new RedeemResult(null, LinkFailure.Expired);
        }

        token.UsedAtUtc = now;
        var user = await db.Users.SingleOrDefaultAsync(u => u.Email == token.Email, cancellationToken);
        if (user is null)
        {
            user = User.CreateMember(token.Email, now);
            db.Users.Add(user);
        }

        // Opening the link proves the person controls this inbox, so the address is verified (L2-029).
        if (!await db.VerifiedEmails.AnyAsync(v => v.NormalizedEmail == token.Email, cancellationToken))
        {
            db.VerifiedEmails.Add(new VerifiedEmail { NormalizedEmail = token.Email, VerifiedAtUtc = now });
        }

        var session = Session.Start(user.Id, now, DeviceDescription.From(request.UserAgent));
        db.Sessions.Add(session);
        activity.Record(ActivityEventType.SignedIn, user.Id, session.Device);
        await db.SaveChangesAsync(cancellationToken);

        const string home = "/";
        return new RedeemResult(new SignedIn(session.Id, user.Id, user.Email, user.Name ?? user.Email, user.Role, token.ReturnUrl ?? home), null);
    }
}

/// <summary>Starts a session for an existing user, or for a new unverified one when asked; the test sign-in seam uses it (ADR 0002, ADR 0009).</summary>
/// <summary>
/// The test seam's sign-in. <paramref name="Administrator"/> signs in as an administrator, creating the account with
/// a verified email if it does not exist, so tests never change the role of a shared seeded account (L2-103).
/// </summary>
public sealed record StartSessionCommand(string Email, bool CreateUnverified = false, bool Administrator = false, string? UserAgent = null) : IRequest<SignedIn?>;

public sealed class StartSessionCommandHandler(IAppDbContext db, IClock clock, IActivityLog activity) : IRequestHandler<StartSessionCommand, SignedIn?>
{
    public async Task<SignedIn?> Handle(StartSessionCommand request, CancellationToken cancellationToken)
    {
        var user = await db.Users.SingleOrDefaultAsync(u => u.Email == request.Email, cancellationToken);
        if (user is null && request.CreateUnverified)
        {
            // A brand-new account whose address has not proved inbox control, for tests of L2-029.
            user = User.CreateMember(request.Email, clock.UtcNow);
            db.Users.Add(user);
        }

        if (request.Administrator)
        {
            if (user is null)
            {
                user = User.CreateMember(request.Email, clock.UtcNow);
                db.Users.Add(user);
                var normalized = request.Email.Trim().ToLowerInvariant();
                if (!await db.VerifiedEmails.AnyAsync(v => v.NormalizedEmail == normalized, cancellationToken))
                {
                    db.VerifiedEmails.Add(new VerifiedEmail { NormalizedEmail = normalized, VerifiedAtUtc = clock.UtcNow });
                }
            }

            user.Role = UserRole.Admin;
        }

        if (user is null)
        {
            return null;
        }

        var session = Session.Start(user.Id, clock.UtcNow, DeviceDescription.From(request.UserAgent));
        db.Sessions.Add(session);
        activity.Record(ActivityEventType.SignedIn, user.Id, session.Device);
        await db.SaveChangesAsync(cancellationToken);
        return new SignedIn(session.Id, user.Id, user.Email, user.Name ?? user.Email, user.Role, "/");
    }
}
