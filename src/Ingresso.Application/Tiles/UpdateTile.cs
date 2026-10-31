using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Ingresso.Application.Common.Exceptions;
using Ingresso.Application.Common.Interfaces;

namespace Ingresso.Application.Tiles;

public sealed record UpdateTileCommand(Guid Id, string Name, string Url, string? Description, string Color, string? Initial, string? Category, string? Size) : IRequest<TileDto>;

public sealed class UpdateTileCommandValidator : AbstractValidator<UpdateTileCommand>
{
    public UpdateTileCommandValidator()
    {
        RuleFor(c => c.Name).NotEmpty().MaximumLength(80);
        RuleFor(c => c.Url).MustBeTileUrl();
        RuleFor(c => c.Color).MustBeHexColor();
        RuleFor(c => c.Description).MaximumLength(300);
        RuleFor(c => c.Category).MaximumLength(60);
        RuleFor(c => c.Initial).MaximumLength(2);
        RuleFor(c => c.Size).Must(s => s is null || TileRules.IsSize(s)).WithMessage("Size must be large or small.");
    }
}

public sealed class UpdateTileCommandHandler(IAppDbContext db, ICurrentUser current) : IRequestHandler<UpdateTileCommand, TileDto>
{
    public async Task<TileDto> Handle(UpdateTileCommand request, CancellationToken cancellationToken)
    {
        var owner = current.UserId ?? throw new ForbiddenAccessException();
        var tile = await db.Tiles.SingleOrDefaultAsync(t => t.Id == request.Id && t.OwnerId == owner, cancellationToken)
            ?? throw new NotFoundException("Tile not found.");
        var name = request.Name.Trim();
        tile.Name = name;
        tile.Url = TileRules.NormalizeUrl(request.Url)!;
        tile.Description = TileRules.Clean(request.Description);
        tile.Color = request.Color;
        tile.Initial = TileRules.InitialFor(request.Initial, name);
        tile.Category = TileRules.Clean(request.Category);
        if (request.Size is not null)
        {
            tile.Size = TileRules.ParseSize(request.Size);
        }

        await db.SaveChangesAsync(cancellationToken);
        return TileDto.From(tile);
    }
}
