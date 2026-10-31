using Ingresso.Domain.Enums;

namespace Ingresso.Domain.Entities;

/// <summary>One app tile on its owner's front-door dashboard.</summary>
public class Tile
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OwnerId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string? Description { get; set; }

    /// <summary>Hex colour such as <c>#0f6cbd</c>.</summary>
    public string Color { get; set; } = "#0f6cbd";

    /// <summary>One or two characters shown on the tile.</summary>
    public string Initial { get; set; } = string.Empty;
    public string? Category { get; set; }
    public int SortOrder { get; set; }
    public TileSize Size { get; set; } = TileSize.Small;

    /// <summary>Column of the top-left cell on the 12-column dashboard grid, from 0.</summary>
    public int X { get; set; }

    /// <summary>Row of the top-left cell, from 0.</summary>
    public int Y { get; set; }

    /// <summary>Column span.</summary>
    public int Cols { get; set; } = 3;

    /// <summary>Row span.</summary>
    public int Rows { get; set; } = 2;
    public DateTimeOffset? LastOpenedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
