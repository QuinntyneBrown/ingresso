using MediatR;
using Microsoft.EntityFrameworkCore;
using Ingresso.Application.Common.Exceptions;
using Ingresso.Application.Common.Interfaces;

namespace Ingresso.Application.Tiles;

public sealed record GetTileQuery(Guid Id) : IRequest<TileDto>;

public sealed class GetTileQueryHandler(IAppDbContext db, ICurrentUser current) : IRequestHandler<GetTileQuery, TileDto>
{
    public async Task<TileDto> Handle(GetTileQuery request, CancellationToken cancellationToken)
    {
        var owner = current.UserId ?? throw new ForbiddenAccessException();
        var tile = await db.Tiles.AsNoTracking().SingleOrDefaultAsync(t => t.Id == request.Id && t.OwnerId == owner, cancellationToken)
            ?? throw new NotFoundException("Tile not found.");
        return TileDto.From(tile);
    }
}
