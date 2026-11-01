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

    /// <summary>Changes an app with the registration rules: 400, 409 and 404 as for registering (L2-112).</summary>
    [HttpPut("{clientId}")]
    public async Task<ClientDto> Update(string clientId, ClientChanges changes, CancellationToken cancellationToken) =>
        await sender.Send(
            new UpdateClientCommand(
                clientId, changes.Name, changes.RedirectUris, changes.PostLogoutRedirectUris, changes.Scopes, changes.FrontChannelLogoutUri,
                changes.OfflineAccess),
            cancellationToken);

    /// <summary>Gives a confidential app a new secret, returned this once; 400 for a public app (L2-113).</summary>
    [HttpPost("{clientId}/secret")]
    public async Task<RegisteredClientDto> RotateSecret(string clientId, CancellationToken cancellationToken) =>
        await sender.Send(new RotateClientSecretCommand(clientId), cancellationToken);
}

/// <summary>What the edit dialog sends: the registration fields an app may change (L2-112).</summary>
public sealed record ClientChanges(
    string? Name, IReadOnlyList<string>? RedirectUris, IReadOnlyList<string>? PostLogoutRedirectUris, IReadOnlyList<string>? Scopes,
    string? FrontChannelLogoutUri, bool OfflineAccess);
