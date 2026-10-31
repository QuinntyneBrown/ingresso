using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Ingresso.Application.Common.Interfaces;

namespace Ingresso.Api.Auth;

/// <summary>The signed-in account's email must have proved inbox control before the tile endpoints answer (L2-029).</summary>
public sealed class VerifiedEmailRequirement : IAuthorizationRequirement;

public sealed class VerifiedEmailHandler(IAppDbContext db) : AuthorizationHandler<VerifiedEmailRequirement>
{
    protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, VerifiedEmailRequirement requirement)
    {
        var email = context.User.FindFirst(ClaimTypes.Email)?.Value?.Trim().ToLowerInvariant();
        if (email is not null && await db.VerifiedEmails.AnyAsync(v => v.NormalizedEmail == email))
        {
            context.Succeed(requirement);
        }
    }
}
