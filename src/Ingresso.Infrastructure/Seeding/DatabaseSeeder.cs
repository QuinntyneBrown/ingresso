using Ingresso.Application.Tiles;
using Microsoft.EntityFrameworkCore;
using Ingresso.Application.Common.Interfaces;
using Ingresso.Domain.Entities;
using Ingresso.Domain.Enums;
using Ingresso.Infrastructure.Persistence;

namespace Ingresso.Infrastructure.Seeding;

/// <summary>Adds a dev user and sample tiles. Rows that already exist (by email, or tile name per user) are left alone, so it is safe to re-run.</summary>
public sealed class DatabaseSeeder(AppDbContext db, IClock clock)
{
    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        var now = clock.UtcNow;
        var user = await db.Users.SingleOrDefaultAsync(u => u.Email == SeedData.UserEmail, cancellationToken);
        if (user is null)
        {
            user = new User { Email = SeedData.UserEmail, Name = SeedData.UserName, Role = UserRole.Member, CreatedAtUtc = now };
            db.Users.Add(user);
        }

        var placed = await db.Tiles.Where(t => t.OwnerId == user.Id).ToListAsync(cancellationToken);
        var names = placed.Select(t => t.Name).ToHashSet(StringComparer.OrdinalIgnoreCase);
        var order = placed.Count;
        foreach (var seed in SeedData.Tiles.Where(s => !names.Contains(s.Name)))
        {
            // Large tiles take 4 by 3 and small ones 3 by 2, placed in reading order (L2-009).
            var (cols, rows) = seed.Size == TileSize.Large ? (4, 3) : (TileLayout.DefaultCols, TileLayout.DefaultRows);
            var (x, y) = TileLayout.FirstFree(placed, cols, rows);
            var tile = new Tile
            {
                OwnerId = user.Id, Name = seed.Name, Url = seed.Url, Description = seed.Description, Color = seed.Color,
                Initial = seed.Initial, Category = seed.Category, Size = seed.Size, SortOrder = order, CreatedAt = now.AddSeconds(order++),
                X = x, Y = y, Cols = cols, Rows = rows,
            };
            placed.Add(tile);
            db.Tiles.Add(tile);
        }

        await db.SaveChangesAsync(cancellationToken);
    }
}
