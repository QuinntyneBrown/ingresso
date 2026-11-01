using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Ingresso.Application.Common.Interfaces;
using Ingresso.Domain.Enums;

namespace Ingresso.Api.Auth;

/// <summary>The signed-in account must be an administrator (L2-103, L2-104).</summary>
public sealed class AdministratorRequirement : IAuthorizationRequirement;

/// <summary>
/// Reads the role from the database, not the cookie's role claim, so a grant applies at once and a role taken away
/// stops working at once (ADR 0016).
/// </summary>
public sealed class AdministratorHandler(IAppDbContext db) : AuthorizationHandler<AdministratorRequirement>
{
    protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, AdministratorRequirement requirement)
    {
        if (Guid.TryParse(context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId)
            && await db.Users.AnyAsync(u => u.Id == userId && u.Role == UserRole.Admin))
        {
            context.Succeed(requirement);
        }
    }
}
