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
using Ingresso.Application.Consent;
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
    /// <summary>The parameter the consent page adds to the authorize request when the person chooses Deny (ADR 0018).</summary>
    public const string ConsentParameter = "consent";

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

        // Deny on the consent page: OpenIddict returns access_denied to the checked redirect address (L2-124).
        if ((string?)request[ConsentParameter] == "deny")
        {
            return Forbid(
                new AuthenticationProperties(new Dictionary<string, string?>
                {
                    [OpenIddictServerAspNetCoreConstants.Properties.Error] = Errors.AccessDenied,
                    [OpenIddictServerAspNetCoreConstants.Properties.ErrorDescription] = "The person chose not to let the app sign them in.",
                }),
                OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
        }

        // Ask before the app gets more than sign-in; the consent page resumes this request (L2-121, ADR 0018).
        var consent = await sender.Send(new GetConsentQuery(person.UserId, request.ClientId!, [.. request.GetScopes()]), cancellationToken);
        if (consent.Ask.Count > 0)
        {
            return Redirect("/consent" + Request.QueryString);
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
        identity.SetClaim(IdentityProviderSetup.ChainStartedClaim, clock.UtcNow.ToString("O", CultureInfo.InvariantCulture));
        identity.SetScopes(request.GetScopes());
        // The tokens belong to the approval that covers these scopes, so revoking it revokes them (L2-123).
        if (await sender.Send(new FindApprovalQuery(person.UserId, request.ClientId!, [.. request.GetScopes()]), cancellationToken) is { } approval)
        {
            identity.SetAuthorizationId(approval);
        }

        SetProfileClaims(identity, person);
        // The access token's audience is each API whose scopes were granted (L2-097).
        var resources = new List<string>();
        await foreach (var resource in scopes.ListResourcesAsync(identity.GetScopes(), HttpContext.RequestAborted))
        {
            resources.Add(resource);
        }

        identity.SetResources(resources.Distinct(StringComparer.Ordinal));
        // The chain start stays inside code and refresh tokens; no app ever sees it.
        SetDestinations(identity);
        return SignIn(new ClaimsPrincipal(identity), OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
    }

    /// <summary>
    /// The person's details each granted scope allows: `name` with `profile` when they have one, `email` and
    /// `email_verified` with `email`; with neither, nothing beyond `sub` (L2-118, L2-119). Replaces any already set.
    /// </summary>
    private static void SetProfileClaims(ClaimsIdentity identity, SignInClaims person)
    {
        identity.SetClaim(Claims.Name, identity.HasScope(Scopes.Profile) ? person.Name : null);
        identity.SetClaim(Claims.Email, identity.HasScope(Scopes.Email) ? person.Email : null);
        identity.SetClaim(Claims.EmailVerified, identity.HasScope(Scopes.Email) ? person.EmailVerified : null);
    }

    /// <summary>The session id goes to the ID token only; the chain start stays inside code and refresh tokens.</summary>
    private static void SetDestinations(ClaimsIdentity identity) =>
        identity.SetDestinations(claim => claim.Type switch
        {
            "sid" => [Destinations.IdentityToken],
            IdentityProviderSetup.ChainStartedClaim => [],
            _ => [Destinations.IdentityToken, Destinations.AccessToken],
        });

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

            // Renewed tokens carry the person's details as they are now, by the scopes granted at sign-in (L2-119).
            var person = Guid.TryParse(principal.GetClaim(Claims.Subject), out var userId)
                ? await sender.Send(new GetSignInClaimsQuery(userId), cancellationToken)
                : null;
            if (person is null || principal.Identity is not ClaimsIdentity identity)
            {
                return Refuse("The account this token was issued for no longer exists.");
            }

            SetProfileClaims(identity, person);
            SetDestinations(identity);
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
