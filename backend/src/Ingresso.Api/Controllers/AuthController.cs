using MediatR;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Ingresso.Api.Auth;
using Ingresso.Application.Clients;
using Ingresso.Application.Identity;

namespace Ingresso.Api.Controllers;

[ApiController]
public sealed class AuthController(ISender sender, SessionSignIn sessions) : ControllerBase
{
    /// <summary>Emails a single-use sign-in link (L2-046); always 202, whether or not the account exists.</summary>
    [HttpPost("api/auth/sign-in-links")]
    [AllowAnonymous]
    [EnableRateLimiting(SignInRateLimit.Policy)]
    public async Task<IActionResult> RequestSignInLink(RequestSignInLinkCommand command, CancellationToken cancellationToken)
    {
        await sender.Send(command, cancellationToken);
        return Accepted();
    }

    /// <summary>Opens a sign-in link from the email: starts a session and redirects, or sends the browser to /sign-in?link=used|expired|invalid (L2-028).</summary>
    [HttpGet("auth/redeem")]
    [AllowAnonymous]
    public async Task<IActionResult> Redeem([FromQuery] string? token, CancellationToken cancellationToken)
    {
        var result = string.IsNullOrWhiteSpace(token)
            ? new RedeemResult(null, LinkFailure.Invalid)
            : await sender.Send(new RedeemSignInLinkCommand(token), cancellationToken);
        if (result.SignedIn is not { } signedIn)
        {
            return Redirect($"/sign-in?link={result.Failure.ToString()!.ToLowerInvariant()}");
        }

        await sessions.SignInAsync(HttpContext, signedIn);
        return Redirect(signedIn.RedirectTo);
    }

    /// <summary>A registered app's name for the sign-in page, so a crafted link cannot put its own text there (L2-093); 404 when unknown.</summary>
    [HttpGet("api/auth/apps/{clientId}")]
    [AllowAnonymous]
    public async Task<ActionResult<AppNameDto>> AppName(string clientId, CancellationToken cancellationToken) =>
        await sender.Send(new GetClientNameQuery(clientId), cancellationToken) is { } name ? new AppNameDto(name) : NotFound();

    /// <summary>Emails the signed-in, unverified account a new verification link; always 202, rate limited per account (L2-029).</summary>
    [HttpPost("api/auth/verification-emails")]
    [Authorize]
    [EnableRateLimiting(SignInRateLimit.VerificationPolicy)]
    public async Task<IActionResult> ResendVerification(CancellationToken cancellationToken)
    {
        await sender.Send(new ResendVerificationCommand(), cancellationToken);
        return Accepted();
    }

    /// <summary>The signed-in user for the header (L2-050); 401 when anonymous.</summary>
    [HttpGet("api/auth/me")]
    [Authorize]
    public async Task<ActionResult<CurrentUserDto>> Me(CancellationToken cancellationToken) =>
        await sender.Send(new GetCurrentUserQuery(), cancellationToken) is { } user ? user : Unauthorized();

    /// <summary>
    /// Signs the current device out: revokes its server session and clears the cookie (L2-031). <c>signedOut</c> is the
    /// ticket for the signed-out page when apps signed in under the session must be signed out too (L2-101), else null.
    /// </summary>
    [HttpPost("api/auth/sign-out")]
    [Authorize]
    public async Task<ActionResult<SignOutResultDto>> SignOutUser(CancellationToken cancellationToken)
    {
        string? ticket = null;
        if (Guid.TryParse(User.FindFirst(SessionSignIn.SessionIdClaim)?.Value, out var sessionId))
        {
            ticket = await sender.Send(new SignOutCommand(sessionId), cancellationToken);
        }

        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return new SignOutResultDto(ticket);
    }

    /// <summary>The apps the signed-out page notifies, from its ticket (L2-101); 404 for an unreadable or old ticket.</summary>
    [HttpGet("api/auth/signed-out")]
    [AllowAnonymous]
    public async Task<ActionResult<SignedOutDto>> SignedOut([FromQuery] string ticket, CancellationToken cancellationToken) =>
        await sender.Send(new GetSignedOutAppsQuery(ticket), cancellationToken) is { } signedOut ? signedOut : NotFound();

    /// <summary>Redeems an email verification link and returns home with the outcome (L2-085).</summary>
    [HttpGet("auth/verify-email")]
    [AllowAnonymous]
    public async Task<IActionResult> VerifyEmail([FromQuery] string? token, CancellationToken cancellationToken)
    {
        var verified = !string.IsNullOrWhiteSpace(token) && await sender.Send(new VerifyEmailCommand(token), cancellationToken);
        return Redirect(verified ? "/?email-verified=1" : "/?email-verified=0");
    }
}

public sealed record AppNameDto(string Name);

public sealed record SignOutResultDto(string? SignedOut);
