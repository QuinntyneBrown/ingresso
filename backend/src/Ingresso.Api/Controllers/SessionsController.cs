using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Ingresso.Application.Identity;

namespace Ingresso.Api.Controllers;

/// <summary>The signed-in person's devices, for Settings → Devices (L2-132 to L2-134).</summary>
[ApiController]
[Authorize]
[Route("api/sessions")]
public sealed class SessionsController(ISender sender) : ControllerBase
{
    /// <summary>Each active session of the person: its device, when it signed in and was last active, and which is this one.</summary>
    [HttpGet]
    public async Task<IReadOnlyList<DeviceDto>> List(CancellationToken cancellationToken) =>
        await sender.Send(new GetDevicesQuery(), cancellationToken);

    /// <summary>Ends the session on another of the person's devices: 204, or 404 when it isn't one.</summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> End(Guid id, CancellationToken cancellationToken)
    {
        await sender.Send(new EndSessionCommand(id), cancellationToken);
        return NoContent();
    }
}
