using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Ingresso.Api.Auth;
using Ingresso.Application.Clients;

namespace Ingresso.Api.Controllers;

/// <summary>The apps that sign in with ingresso, for administrators in Settings → Apps (L2-104 to L2-106).</summary>
[ApiController]
[Route("api/clients")]
[Authorize(Policy = AuthPolicies.Administrator)]
public sealed class ClientsController(ISender sender) : ControllerBase
{
    /// <summary>Every registered app, sorted by name. Secrets are never returned.</summary>
    [HttpGet]
    public async Task<IReadOnlyList<ClientDto>> List(CancellationToken cancellationToken) =>
        await sender.Send(new GetClientsQuery(), cancellationToken);

    /// <summary>
    /// Registers an app with the CLI's rules: 400 with field errors, 409 for a name in use, 404 for an unknown scope.
    /// The response carries a confidential app's secret, which is never returned again (L2-105, L2-106).
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<RegisteredClientDto>> Register(RegisterClientCommand command, CancellationToken cancellationToken)
    {
        var registered = await sender.Send(command, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, registered);
    }
}
