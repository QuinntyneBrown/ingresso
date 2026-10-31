using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Ingresso.Application.Common.Exceptions;
using Ingresso.Application.Common.Interfaces;
using Ingresso.Domain.Entities;

namespace Ingresso.Application.Tiles;

public sealed record CreateTileCommand(string Name, string Url, string? Description, string Color, string? Initial, string? Category) : IRequest<TileDto>;

public sealed class CreateTileCommandValidator : AbstractValidator<CreateTileCommand>
{
    public CreateTileCommandValidator()
    {
        RuleFor(c => c.Name).NotEmpty().MaximumLength(80);
        RuleFor(c => c.Url).MustBeTileUrl();
        RuleFor(c => c.Color).MustBeHexColor();
        RuleFor(c => c.Description).MaximumLength(300);
        RuleFor(c => c.Category).MaximumLength(60);
        RuleFor(c => c.Initial).MaximumLength(2);
    }
}

public sealed class CreateTileCommandHandler(IAppDbContext db, ICurrentUser current, IClock clock) : IRequestHandler<CreateTileCommand, TileDto>
{
    public async Task<TileDto> Handle(CreateTileCommand request, CancellationToken cancellationToken)
    {
        var owner = current.UserId ?? throw new ForbiddenAccessException();
        var existing = await db.Tiles.Where(t => t.OwnerId == owner).ToListAsync(cancellationToken);
        var (x, y) = TileLayout.FirstFree(existing, TileLayout.DefaultCols, TileLayout.DefaultRows);
        var name = request.Name.Trim();
        var tile = new Tile
        {
            OwnerId = owner,
            Name = name,
            Url = TileRules.NormalizeUrl(request.Url)!,
            Description = TileRules.Clean(request.Description),
            Color = request.Color,
            Initial = TileRules.InitialFor(request.Initial, name),
            Category = TileRules.Clean(request.Category),
            X = x,
            Y = y,
            Cols = TileLayout.DefaultCols,
            Rows = TileLayout.DefaultRows,
            CreatedAt = clock.UtcNow,
        };
        db.Tiles.Add(tile);
        await db.SaveChangesAsync(cancellationToken);
        return TileDto.From(tile);
    }
}
