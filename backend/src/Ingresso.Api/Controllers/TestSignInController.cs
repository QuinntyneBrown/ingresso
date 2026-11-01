using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MediatR;
using Ingresso.Application.Identity;

namespace Ingresso.Api.Controllers;

public sealed record TestSignInRequest(string Email, bool CreateUnverified = false, bool Administrator = false);

/// <summary>
/// Test-only seam that signs in a seeded user without the magic-link flow, so integration tests and
/// Playwright can act as a seeded user. It exists only when <c>Auth:TestSignIn:Enabled</c>
/// is true, which no production configuration sets.
/// </summary>
[ApiController]
[Route("api/test")]
[AllowAnonymous]
[IgnoreAntiforgeryToken]
[ApiExplorerSettings(IgnoreApi = true)]
public sealed class TestSignInController(ISender sender, Auth.SessionSignIn sessions) : ControllerBase
{
    [HttpPost("sign-in")]
    public async Task<IActionResult> SignIn(TestSignInRequest request, CancellationToken cancellationToken)
    {
        var signedIn = await sender.Send(new StartSessionCommand(request.Email, request.CreateUnverified, request.Administrator), cancellationToken);
        if (signedIn is null)
        {
            return NotFound();
        }

        await sessions.SignInAsync(HttpContext, signedIn);
        return NoContent();
    }

    /// <summary>One URL for local use: signs in the seeded user (or <c>?email=</c>) and opens the dashboard.</summary>
    [HttpGet("sign-in")]
    public async Task<IActionResult> OpenSignedIn([FromQuery] string email = "dev@ingresso.dev", CancellationToken cancellationToken = default)
    {
        var signedIn = await sender.Send(new StartSessionCommand(email), cancellationToken);
        if (signedIn is null)
        {
            return NotFound();
        }

        await sessions.SignInAsync(HttpContext, signedIn);
        return Redirect("/");
    }

    [HttpPost("sign-out")]
    public async Task<IActionResult> SignOutUser()
    {
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return NoContent();
    }
}
