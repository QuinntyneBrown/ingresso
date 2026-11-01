using MediatR;
using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpenIddict.Abstractions;
using OpenIddict.Server.AspNetCore;
using Ingresso.Application.Identity;
using static OpenIddict.Abstractions.OpenIddictConstants;

namespace Ingresso.Api.Controllers;

/// <summary>
/// The OpenID Connect userinfo endpoint, after OpenIddict has validated the access token: the person's details as they
/// are now, by the token's scopes (L2-120). OpenIddict answers 401 itself for a missing, invalid or expired token, so
/// the cookie policy doesn't apply here.
/// </summary>
[AllowAnonymous]
[ApiExplorerSettings(IgnoreApi = true)]
public sealed class UserinfoController(ISender sender) : ControllerBase
{
    [HttpGet("connect/userinfo"), HttpPost("connect/userinfo")]
    public async Task<IActionResult> Userinfo(CancellationToken cancellationToken)
    {
        var principal = (await HttpContext.AuthenticateAsync(OpenIddictServerAspNetCoreDefaults.AuthenticationScheme)).Principal;
        var person = Guid.TryParse(principal?.GetClaim(Claims.Subject), out var userId)
            ? await sender.Send(new GetSignInClaimsQuery(userId), cancellationToken)
            : null;
        if (principal is null || person is null)
        {
            return Challenge(
                new AuthenticationProperties(new Dictionary<string, string?>
                {
                    [OpenIddictServerAspNetCoreConstants.Properties.Error] = Errors.InvalidToken,
                    [OpenIddictServerAspNetCoreConstants.Properties.ErrorDescription] = "The account this token was issued for no longer exists.",
                }),
                OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
        }

        var claims = new Dictionary<string, object>(StringComparer.Ordinal) { [Claims.Subject] = person.UserId.ToString() };
        if (principal.HasScope(Scopes.Profile) && person.Name is not null)
        {
            claims[Claims.Name] = person.Name;
        }

        if (principal.HasScope(Scopes.Email))
        {
            claims[Claims.Email] = person.Email;
            claims[Claims.EmailVerified] = person.EmailVerified;
        }

        return Ok(claims);
    }
}
