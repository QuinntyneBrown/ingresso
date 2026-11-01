using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Ingresso.Application.Common;
using Ingresso.Application.Common.Interfaces;
using Ingresso.Application.Common.Messages;
using Ingresso.Domain.Enums;

namespace Ingresso.Application.Identity;

/// <summary>Sends the signed-in user a new 24-hour verification link, unless they are already verified (L2-053).</summary>
public sealed record ResendVerificationCommand : IRequest;

public sealed class ResendVerificationCommandHandler(
    IAppDbContext db,
    ICurrentUser current,
    IOutbox outbox,
    ISecurityTokenService tokens,
    IOptions<SiteOptions> site) : IRequestHandler<ResendVerificationCommand>
{
    public async Task Handle(ResendVerificationCommand request, CancellationToken cancellationToken)
    {
        var email = await db.Users.Where(u => u.Id == current.UserId).Select(u => u.Email).SingleAsync(cancellationToken);
        if (await db.VerifiedEmails.AnyAsync(v => v.NormalizedEmail == email, cancellationToken))
        {
            return;
        }

        var token = tokens.Issue(email, SecurityTokenPurpose.VerifyEmail, TimeSpan.FromHours(24));
        outbox.Enqueue(new SendEmail(new EmailMessage(
            email,
            "Verify your email",
            $"Confirm that {email} is yours so we can trust it:\n\n{site.Value.PublicBaseUrl.TrimEnd('/')}/auth/verify-email?token={token}\n\nThe link works for 24 hours.")));
        await db.SaveChangesAsync(cancellationToken);
    }
}
