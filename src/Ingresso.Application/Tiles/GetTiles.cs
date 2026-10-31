using MediatR;
using Microsoft.EntityFrameworkCore;
using Ingresso.Application.Common.Exceptions;
using Ingresso.Application.Common.Interfaces;

namespace Ingresso.Application.Tiles;

public sealed record GetTilesQuery : IRequest<IReadOnlyList<TileDto>>;

public sealed class GetTilesQueryHandler(IAppDbContext db, ICurrentUser current) : IRequestHandler<GetTilesQuery, IReadOnlyList<TileDto>>
{
    public async Task<IReadOnlyList<TileDto>> Handle(GetTilesQuery request, CancellationToken cancellationToken)
    {
        var owner = current.UserId ?? throw new ForbiddenAccessException();
        var tiles = await db.Tiles.AsNoTracking().Where(t => t.OwnerId == owner).OrderBy(t => t.Y).ThenBy(t => t.X).ThenBy(t => t.CreatedAt).ToListAsync(cancellationToken);
        return tiles.Select(TileDto.From).ToList();
    }
}
