using MediatR;
using Microsoft.EntityFrameworkCore;
using Ingresso.Application.Common.Exceptions;
using Ingresso.Application.Common.Interfaces;

namespace Ingresso.Application.Tiles;

/// <summary>Restores the default layout (L2-019): tiles in creation order at 3 by 2, four per row.</summary>
public sealed record ResetLayoutCommand : IRequest<IReadOnlyList<TileDto>>;

public sealed class ResetLayoutCommandHandler(IAppDbContext db, ICurrentUser current) : IRequestHandler<ResetLayoutCommand, IReadOnlyList<TileDto>>
{
    public async Task<IReadOnlyList<TileDto>> Handle(ResetLayoutCommand request, CancellationToken cancellationToken)
    {
        var owner = current.UserId ?? throw new ForbiddenAccessException();
        var tiles = (await db.Tiles.Where(t => t.OwnerId == owner).ToListAsync(cancellationToken)).OrderBy(t => t.CreatedAt).ThenBy(t => t.Name).ToList();
        var perRow = TileLayout.Columns / TileLayout.DefaultCols;
        for (var i = 0; i < tiles.Count; i++)
        {
            tiles[i].SortOrder = i;
            tiles[i].X = i % perRow * TileLayout.DefaultCols;
            tiles[i].Y = i / perRow * TileLayout.DefaultRows;
            tiles[i].Cols = TileLayout.DefaultCols;
            tiles[i].Rows = TileLayout.DefaultRows;
        }

        await db.SaveChangesAsync(cancellationToken);
        return tiles.Select(TileDto.From).ToList();
    }
}
