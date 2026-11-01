using MediatR;
using Microsoft.EntityFrameworkCore;
using Ingresso.Application.Common.Exceptions;
using Ingresso.Application.Common.Interfaces;

namespace Ingresso.Application.Tiles;

public sealed record DeleteTileCommand(Guid Id) : IRequest;

public sealed class DeleteTileCommandHandler(IAppDbContext db, ICurrentUser current) : IRequestHandler<DeleteTileCommand>
{
    public async Task Handle(DeleteTileCommand request, CancellationToken cancellationToken)
    {
        var owner = current.UserId ?? throw new ForbiddenAccessException();
        var tile = await db.Tiles.SingleOrDefaultAsync(t => t.Id == request.Id && t.OwnerId == owner, cancellationToken)
            ?? throw new NotFoundException("Tile not found.");
        db.Tiles.Remove(tile);
        await db.SaveChangesAsync(cancellationToken);
    }
}
