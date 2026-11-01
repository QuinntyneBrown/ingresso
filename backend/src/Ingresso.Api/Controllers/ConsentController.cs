using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Ingresso.Application.Common.Interfaces;
using Ingresso.Application.Consent;

namespace Ingresso.Api.Controllers;

/// <summary>
/// The consent page's reads and Allow (ADR 0018). Allow is a cookie-authenticated write, so the anti-forgery middleware
/// refuses it without the token (L2-034, L2-127).
/// </summary>
[ApiController]
[Authorize]
[Route("api/consent")]
public sealed class ConsentController(ISender sender, ICurrentUser currentUser) : ControllerBase
{
    /// <summary>The app, the signed-in email, and the requested scopes still to approve, in plain words (L2-121, L2-122).</summary>
    [HttpGet]
    public async Task<ConsentDto> Get([FromQuery(Name = "client_id")] string clientId, [FromQuery] string? scope, CancellationToken cancellationToken) =>
        await sender.Send(new GetConsentQuery(currentUser.UserId!.Value, clientId, Split(scope)), cancellationToken);

    /// <summary>Records the approval; the page then resumes the authorize request (L2-123).</summary>
    [HttpPost]
    public async Task<IActionResult> Allow(ConsentChoice choice, CancellationToken cancellationToken)
    {
        await sender.Send(new ApproveConsentCommand(currentUser.UserId!.Value, choice.ClientId, Split(choice.Scope)), cancellationToken);
        return NoContent();
    }

    private static string[] Split(string? scope) => (scope ?? "").Split(' ', StringSplitOptions.RemoveEmptyEntries);
}

/// <summary>What Allow sends: the app and the scopes of its authorize request.</summary>
public sealed record ConsentChoice(string ClientId, string? Scope);
