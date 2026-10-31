using Ingresso.Domain.Entities;

namespace Ingresso.Application.Tiles;

/// <summary>The dashboard grid's rules (L2-009, L2-051, L2-052): 12 columns, span limits and placement.</summary>
public static class TileLayout
{
    public const int Columns = 12;
    public const int DefaultCols = 3;
    public const int DefaultRows = 2;
    public const int MinCols = 2;
    public const int MaxCols = Columns;
    public const int MinRows = 1;
    public const int MaxRows = 8;

    public static bool Overlaps(int ax, int ay, int acols, int arows, int bx, int by, int bcols, int brows) =>
        ax < bx + bcols && bx < ax + acols && ay < by + brows && by < ay + arows;

    /// <summary>The first cell, in reading order, where a span of the given size fits beside the occupied tiles.</summary>
    public static (int X, int Y) FirstFree(IReadOnlyCollection<Tile> occupied, int cols, int rows)
    {
        for (var y = 0; ; y++)
        {
            for (var x = 0; x + cols <= Columns; x++)
            {
                if (occupied.All(t => !Overlaps(x, y, cols, rows, t.X, t.Y, t.Cols, t.Rows)))
                {
                    return (x, y);
                }
            }
        }
    }
}
