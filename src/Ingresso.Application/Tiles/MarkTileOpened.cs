using MediatR;
using Microsoft.EntityFrameworkCore;
using Ingresso.Application.Common.Exceptions;
using Ingresso.Application.Common.Interfaces;

namespace Ingresso.Application.Tiles;

public sealed record MarkTileOpenedCommand(Guid Id) : IRequest<TileDto>;

public sealed class MarkTileOpenedCommandHandler(IAppDbContext db, ICurrentUser current, IClock clock) : IRequestHandler<MarkTileOpenedCommand, TileDto>
{
    public async Task<TileDto> Handle(MarkTileOpenedCommand request, CancellationToken cancellationToken)
    {
        var owner = current.UserId ?? throw new ForbiddenAccessException();
        var tile = await db.Tiles.SingleOrDefaultAsync(t => t.Id == request.Id && t.OwnerId == owner, cancellationToken)
            ?? throw new NotFoundException("Tile not found.");
        tile.LastOpenedAt = clock.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
        return TileDto.From(tile);
    }
}
