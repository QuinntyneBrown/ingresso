using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Ingresso.Api.Auth;
using Ingresso.Application.Resources;

namespace Ingresso.Api.Controllers;

/// <summary>The registered APIs and their scopes, for the register-app dialog (L2-105).</summary>
[ApiController]
[Route("api/resources")]
[Authorize(Policy = AuthPolicies.Administrator)]
public sealed class ResourcesController(ISender sender) : ControllerBase
{
    [HttpGet]
    public async Task<IReadOnlyList<ResourceDto>> List(CancellationToken cancellationToken) =>
        await sender.Send(new GetResourcesQuery(), cancellationToken);
}
