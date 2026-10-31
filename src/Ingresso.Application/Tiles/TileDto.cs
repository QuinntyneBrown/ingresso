using Ingresso.Domain.Entities;

namespace Ingresso.Application.Tiles;

public sealed record TileDto(
    Guid Id, string Name, string Url, string? Description, string Color, string Initial,
    string? Category, DateTimeOffset? LastOpenedAt, DateTimeOffset CreatedAt,
    int X, int Y, int Cols, int Rows)
{
    public static TileDto From(Tile t) =>
        new(t.Id, t.Name, t.Url, t.Description, t.Color, t.Initial, t.Category, t.LastOpenedAt, t.CreatedAt, t.X, t.Y, t.Cols, t.Rows);
}
