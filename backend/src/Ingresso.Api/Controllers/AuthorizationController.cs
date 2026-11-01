using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpenIddict.Abstractions;
using OpenIddict.Server.AspNetCore;
using Ingresso.Api.Auth;
using Ingresso.Application.Identity;
using static OpenIddict.Abstractions.OpenIddictConstants;

namespace Ingresso.Api.Controllers;

/// <summary>
/// The authorization endpoint after OpenIddict has validated the request (ADR 0014). It reuses the ingresso cookie
/// session: without one the person signs in by email link and comes back here (L2-092 to L2-094).
/// </summary>
[ApiController]
[AllowAnonymous]
[IgnoreAntiforgeryToken]
[ApiExplorerSettings(IgnoreApi = true)]
public sealed class AuthorizationController(ISender sender, IOpenIddictScopeManager scopes) : ControllerBase
{
    [HttpGet("connect/authorize")]
    [HttpPost("connect/authorize")]
    public async Task<IActionResult> Authorize(CancellationToken cancellationToken)
    {
        var request = HttpContext.GetOpenIddictServerRequest()
            ?? throw new InvalidOperationException("The OpenID Connect request cannot be retrieved.");

        var session = await HttpContext.AuthenticateAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        if (!session.Succeeded || !Guid.TryParse(session.Principal.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
        {
            return Redirect("/sign-in?returnUrl=" + Uri.EscapeDataString(Request.Path + Request.QueryString));
        }

        var person = await sender.Send(new GetSignInClaimsQuery(userId), cancellationToken);
        if (person is null)
        {
            return Redirect("/sign-in?returnUrl=" + Uri.EscapeDataString(Request.Path + Request.QueryString));
        }

        if (!person.EmailVerified)
        {
            return Redirect("/verify-email");
        }

        // Record the app against this session so signing out can notify it, and tell the app its session (L2-099).
        var sessionId = session.Principal.FindFirstValue(SessionSignIn.SessionIdClaim);
        if (Guid.TryParse(sessionId, out var sid))
        {
            await sender.Send(new RecordAppSignInCommand(sid, request.ClientId!), cancellationToken);
        }

        var identity = new ClaimsIdentity(OpenIddictServerAspNetCoreDefaults.AuthenticationScheme, Claims.Name, Claims.Role);
        identity.SetClaim(Claims.Subject, person.UserId.ToString());
        identity.SetClaim("sid", sessionId);
        identity.SetClaim(Claims.Email, person.Email);
        identity.SetScopes(request.GetScopes());
        // The access token's audience is each API whose scopes were granted (L2-097).
        var resources = new List<string>();
        await foreach (var resource in scopes.ListResourcesAsync(identity.GetScopes(), HttpContext.RequestAborted))
        {
            resources.Add(resource);
        }

        identity.SetResources(resources.Distinct(StringComparer.Ordinal));
        identity.SetDestinations(claim => claim.Type == "sid"
            ? [Destinations.IdentityToken]
            : [Destinations.IdentityToken, Destinations.AccessToken]);
        return SignIn(new ClaimsPrincipal(identity), OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
    }
}
