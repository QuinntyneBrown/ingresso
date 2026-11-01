using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Ingresso.Application.Consent;

namespace Ingresso.Api.Controllers;

/// <summary>The signed-in person's connected apps, for Settings → Connected apps (L2-128 to L2-130).</summary>
[ApiController]
[Authorize]
[Route("api/connected-apps")]
public sealed class ConnectedAppsController(ISender sender) : ControllerBase
{
    /// <summary>Each app the person approved, with what it can do, when they approved it and when it last got a token.</summary>
    [HttpGet]
    public async Task<IReadOnlyList<ConnectedAppDto>> List(CancellationToken cancellationToken) =>
        await sender.Send(new GetConnectedAppsQuery(), cancellationToken);
}
