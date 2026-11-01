using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Ingresso.Application.Tiles;

namespace Ingresso.Api.Controllers;

public sealed record TileRequest(string Name, string Url, string? Description, string Color, string? Initial, string? Category);

public sealed record SaveLayoutRequest(IReadOnlyList<TilePlacement> Tiles);

/// <summary>The signed-in user's tiles; the account's email must be verified (L2-029). The global CSRF middleware guards the unsafe methods.</summary>
[ApiController]
[Authorize(Policy = Auth.AuthPolicies.VerifiedEmail)]
[Route("api/tiles")]
public sealed class TilesController(ISender sender) : ControllerBase
{
    [HttpGet]
    public async Task<IReadOnlyList<TileDto>> List(CancellationToken ct) => await sender.Send(new GetTilesQuery(), ct);

    [HttpGet("{id:guid}")]
    public async Task<TileDto> Get(Guid id, CancellationToken ct) => await sender.Send(new GetTileQuery(id), ct);

    [HttpPost]
    public async Task<IActionResult> Create(TileRequest body, CancellationToken ct)
    {
        var tile = await sender.Send(new CreateTileCommand(body.Name, body.Url, body.Description, body.Color, body.Initial, body.Category), ct);
        return CreatedAtAction(nameof(Get), new { id = tile.Id }, tile);
    }

    [HttpPut("{id:guid}")]
    public async Task<TileDto> Update(Guid id, TileRequest body, CancellationToken ct) =>
        await sender.Send(new UpdateTileCommand(id, body.Name, body.Url, body.Description, body.Color, body.Initial, body.Category), ct);

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await sender.Send(new DeleteTileCommand(id), ct);
        return NoContent();
    }

    [HttpPut("layout")]
    public async Task<IReadOnlyList<TileDto>> SaveLayout(SaveLayoutRequest body, CancellationToken ct) =>
        await sender.Send(new SaveLayoutCommand(body.Tiles ?? []), ct);

    [HttpPost("{id:guid}/opened")]
    public async Task<TileDto> MarkOpened(Guid id, CancellationToken ct) => await sender.Send(new MarkTileOpenedCommand(id), ct);

    [HttpPost("reset-layout")]
    public async Task<IReadOnlyList<TileDto>> ResetLayout(CancellationToken ct) => await sender.Send(new ResetLayoutCommand(), ct);
}
