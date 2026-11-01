using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Ingresso.Application.Identity;

namespace Ingresso.Api.Controllers;

/// <summary>The signed-in person's own profile: their display name and email (L2-117).</summary>
[ApiController]
[Authorize]
[Route("api/profile")]
public sealed class ProfileController(ISender sender) : ControllerBase
{
    [HttpGet]
    public async Task<ProfileDto> Get(CancellationToken cancellationToken) =>
        await sender.Send(new GetProfileQuery(), cancellationToken);

    /// <summary>Sets or clears the display name; 400 with field errors when it breaks the rules.</summary>
    [HttpPut]
    public async Task<ProfileDto> Update(ProfileChanges changes, CancellationToken cancellationToken) =>
        await sender.Send(new UpdateProfileCommand(changes.DisplayName), cancellationToken);
}

/// <summary>What the Edit your profile dialog sends.</summary>
public sealed record ProfileChanges(string? DisplayName);
