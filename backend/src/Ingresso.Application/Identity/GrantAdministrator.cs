using MediatR;
using Microsoft.EntityFrameworkCore;
using Ingresso.Application.Common.Exceptions;
using Ingresso.Application.Common.Interfaces;
using Ingresso.Domain.Enums;

namespace Ingresso.Application.Identity;

/// <summary>
/// Makes an account an administrator (L2-103, ADR 0016). Returns false when it already was one; throws
/// <see cref="NotFoundException"/> for an unknown email.
/// </summary>
public sealed record GrantAdministratorCommand(string Email) : IRequest<bool>;

public sealed class GrantAdministratorCommandHandler(IAppDbContext db) : IRequestHandler<GrantAdministratorCommand, bool>
{
    public async Task<bool> Handle(GrantAdministratorCommand request, CancellationToken cancellationToken)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await db.Users.SingleOrDefaultAsync(u => u.Email.ToLower() == email, cancellationToken)
            ?? throw new NotFoundException($"No account has the email '{request.Email.Trim()}'.");
        if (user.Role == UserRole.Admin)
        {
            return false;
        }

        user.Role = UserRole.Admin;
        await db.SaveChangesAsync(cancellationToken);
        return true;
    }
}
