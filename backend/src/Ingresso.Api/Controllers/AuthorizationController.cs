using System.Globalization;
using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;
using OpenIddict.Abstractions;
using OpenIddict.Server.AspNetCore;
using Ingresso.Api.Auth;
using Ingresso.Application.Clients;
using Ingresso.Application.Common.Interfaces;
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
public sealed class AuthorizationController(ISender sender, IOpenIddictScopeManager scopes, IClock clock, IConfiguration configuration) : ControllerBase
{
    [HttpGet("connect/authorize")]
    [HttpPost("connect/authorize")]
    public async Task<IActionResult> Authorize(CancellationToken cancellationToken)
    {
        var request = HttpContext.GetOpenIddictServerRequest()
            ?? throw new InvalidOperationException("The OpenID Connect request cannot be retrieved.");

        // A disabled app signs no one in; it gets the same page as an app ingresso doesn't know (L2-114).
        if (await sender.Send(new IsClientDisabledQuery(request.ClientId!), cancellationToken))
        {
            return Redirect("/authorize-error");
        }

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
        identity.SetClaim(IdentityProviderSetup.ChainStartedClaim, clock.UtcNow.ToString("O", CultureInfo.InvariantCulture));
        identity.SetScopes(request.GetScopes());
        // The access token's audience is each API whose scopes were granted (L2-097).
        var resources = new List<string>();
        await foreach (var resource in scopes.ListResourcesAsync(identity.GetScopes(), HttpContext.RequestAborted))
        {
            resources.Add(resource);
        }

        identity.SetResources(resources.Distinct(StringComparer.Ordinal));
        // The chain start stays inside code and refresh tokens; no app ever sees it.
        identity.SetDestinations(claim => claim.Type switch
        {
            "sid" => [Destinations.IdentityToken],
            IdentityProviderSetup.ChainStartedClaim => [],
            _ => [Destinations.IdentityToken, Destinations.AccessToken],
        });
        return SignIn(new ClaimsPrincipal(identity), OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
    }

    /// <summary>
    /// The token endpoint, after OpenIddict has validated the grant. A code is exchanged as OpenIddict validated it. A
    /// refresh token renews only while the ingresso session it came from is active, and renewing counts as using that
    /// session (L2-110).
    /// </summary>
    [HttpPost("connect/token")]
    public async Task<IActionResult> Exchange(CancellationToken cancellationToken)
    {
        var request = HttpContext.GetOpenIddictServerRequest()
            ?? throw new InvalidOperationException("The OpenID Connect request cannot be retrieved.");
        var principal = (await HttpContext.AuthenticateAsync(OpenIddictServerAspNetCoreDefaults.AuthenticationScheme)).Principal
            ?? throw new InvalidOperationException("The validated grant has no principal.");

        if (await sender.Send(new IsClientDisabledQuery(request.ClientId!), cancellationToken))
        {
            return Refuse("This app is disabled.");
        }

        if (request.IsRefreshTokenGrantType())
        {
            if (!Guid.TryParse(principal.GetClaim("sid"), out var sessionId)
                || !await sender.Send(new TouchSessionCommand(sessionId), cancellationToken))
            {
                return Refuse("The ingresso session this token came from has ended.");
            }

            // No token in the chain outlives its absolute lifetime (L2-109).
            var left = DateTimeOffset.TryParse(principal.GetClaim(IdentityProviderSetup.ChainStartedClaim), CultureInfo.InvariantCulture, DateTimeStyles.None, out var started)
                ? started + IdentityProviderSetup.RefreshTokenAbsoluteLifetime(configuration) - clock.UtcNow
                : TimeSpan.Zero;
            if (left <= TimeSpan.Zero)
            {
                return Refuse("This sign-in is too old to renew. Sign in again.");
            }

            var sliding = IdentityProviderSetup.RefreshTokenSlidingLifetime(configuration);
            principal.SetRefreshTokenLifetime(left < sliding ? left : sliding);
        }

        return SignIn(principal, OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
    }

    private ForbidResult Refuse(string description) => Forbid(
        new AuthenticationProperties(new Dictionary<string, string?>
        {
            [OpenIddictServerAspNetCoreConstants.Properties.Error] = Errors.InvalidGrant,
            [OpenIddictServerAspNetCoreConstants.Properties.ErrorDescription] = description,
        }),
        OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);

    /// <summary>
    /// An app's sign-out (RP-initiated logout), after OpenIddict has checked the ID token hint and that the return address
    /// is registered for the app: ends the session and goes to the signed-out page, which notifies the session's apps
    /// and continues to the return address with the app's state (L2-100). Without a hint nothing happens (L2-102).
    /// </summary>
    [HttpGet("connect/endsession")]
    [HttpPost("connect/endsession")]
    public async Task<IActionResult> EndSession(CancellationToken cancellationToken)
    {
        var request = HttpContext.GetOpenIddictServerRequest()
            ?? throw new InvalidOperationException("The OpenID Connect request cannot be retrieved.");
        if (string.IsNullOrEmpty(request.IdTokenHint))
        {
            return Redirect(IdentityProviderSetup.SignOutErrorPath);
        }

        var returnUrl = request.PostLogoutRedirectUri is not { } address ? null
            : request.State is { } state ? QueryHelpers.AddQueryString(address, "state", state)
            : address;
        var session = await HttpContext.AuthenticateAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        if (!session.Succeeded || !Guid.TryParse(session.Principal.FindFirstValue(SessionSignIn.SessionIdClaim), out var sessionId))
        {
            return Redirect(returnUrl ?? "/sign-in");
        }

        var ticket = await sender.Send(new SignOutCommand(sessionId, returnUrl), cancellationToken);
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return Redirect("/signed-out?ticket=" + Uri.EscapeDataString(ticket!));
    }
}
