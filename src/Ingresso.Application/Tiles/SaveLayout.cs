using FluentValidation;
using FluentValidation.Results;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Ingresso.Application.Common.Exceptions;
using Ingresso.Application.Common.Interfaces;

namespace Ingresso.Application.Tiles;

/// <summary>One tile's cells on the 12-column grid.</summary>
public sealed record TilePlacement(Guid Id, int X, int Y, int Cols, int Rows);

/// <summary>The caller's whole layout: every tile once, inside the grid, with no overlaps (L2-052).</summary>
public sealed record SaveLayoutCommand(IReadOnlyList<TilePlacement> Tiles) : IRequest<IReadOnlyList<TileDto>>;

public sealed class SaveLayoutCommandValidator : AbstractValidator<SaveLayoutCommand>
{
    public SaveLayoutCommandValidator()
    {
        RuleFor(c => c.Tiles).NotNull()
            .Must(tiles => tiles is null || tiles.Select(t => t.Id).Distinct().Count() == tiles.Count)
            .WithMessage("Each tile can appear only once.");
        RuleForEach(c => c.Tiles).ChildRules(tile =>
        {
            tile.RuleFor(t => t.X).GreaterThanOrEqualTo(0);
            tile.RuleFor(t => t.Y).GreaterThanOrEqualTo(0);
            tile.RuleFor(t => t.Cols).InclusiveBetween(TileLayout.MinCols, TileLayout.MaxCols);
            tile.RuleFor(t => t.Rows).InclusiveBetween(TileLayout.MinRows, TileLayout.MaxRows);
            tile.RuleFor(t => t).Must(t => t.X + t.Cols <= TileLayout.Columns)
                .WithName("X").WithMessage("A tile must fit inside the 12 columns.");
        });
    }
}

public sealed class SaveLayoutCommandHandler(IAppDbContext db, ICurrentUser current) : IRequestHandler<SaveLayoutCommand, IReadOnlyList<TileDto>>
{
    public async Task<IReadOnlyList<TileDto>> Handle(SaveLayoutCommand request, CancellationToken cancellationToken)
    {
        var owner = current.UserId ?? throw new ForbiddenAccessException();
        var tiles = await db.Tiles.Where(t => t.OwnerId == owner).ToListAsync(cancellationToken);
        if (tiles.Count != request.Tiles.Count || request.Tiles.Any(p => tiles.All(t => t.Id != p.Id)))
        {
            throw Invalid("The layout must list each of your tiles exactly once.");
        }

        var placed = request.Tiles;
        for (var i = 0; i < placed.Count; i++)
        {
            for (var j = i + 1; j < placed.Count; j++)
            {
                if (TileLayout.Overlaps(placed[i].X, placed[i].Y, placed[i].Cols, placed[i].Rows, placed[j].X, placed[j].Y, placed[j].Cols, placed[j].Rows))
                {
                    throw Invalid("Tiles cannot overlap.");
                }
            }
        }

        foreach (var p in placed)
        {
            var tile = tiles.Single(t => t.Id == p.Id);
            (tile.X, tile.Y, tile.Cols, tile.Rows) = (p.X, p.Y, p.Cols, p.Rows);
        }

        await db.SaveChangesAsync(cancellationToken);
        return tiles.OrderBy(t => t.Y).ThenBy(t => t.X).Select(TileDto.From).ToList();
    }

    private static ValidationException Invalid(string message) =>
        new([new ValidationFailure(nameof(SaveLayoutCommand.Tiles), message)]);
}
