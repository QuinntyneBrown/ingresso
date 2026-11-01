using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Ingresso.Domain.Enums;
using Ingresso.Infrastructure.Persistence;
using Ingresso.Infrastructure.Seeding;

namespace Ingresso.Infrastructure.Tests;

public sealed class DatabaseSeederTests : IDisposable
{
    private readonly SqliteDatabase database = new();

    [Fact]
    public async Task Seeds_a_dev_user_with_three_large_and_eight_small_tiles_in_order()
    {
        await database.RunAsync(sp => Seed(sp));

        var (user, tiles) = await database.RunAsync(async sp =>
        {
            var db = sp.GetRequiredService<AppDbContext>();
            var dev = await db.Users.SingleAsync(u => u.Email == SeedData.UserEmail);
            return (dev, await db.Tiles.Where(t => t.OwnerId == dev.Id).OrderBy(t => t.Y).ThenBy(t => t.X).ToListAsync());
        });

        Assert.Equal(UserRole.Member, user.Role);
        Assert.Equal(3, tiles.Count(t => t is { Cols: 4, Rows: 3 }));
        Assert.Equal(8, tiles.Count(t => t is { Cols: 3, Rows: 2 }));
        Assert.Equal(["Gmail", "Slack", "Linear"], tiles.Take(3).Select(t => t.Name));
    }

    [Fact]
    public async Task Seeding_twice_adds_nothing_new()
    {
        await database.RunAsync(sp => Seed(sp));
        var first = await database.RunAsync(sp => Counts(sp));

        await database.RunAsync(sp => Seed(sp));
        var second = await database.RunAsync(sp => Counts(sp));

        Assert.Equal(first, second);
        Assert.Equal((1, 11), second);
    }

    private static async Task<bool> Seed(IServiceProvider sp)
    {
        await sp.GetRequiredService<DatabaseSeeder>().SeedAsync();
        return true;
    }

    private static async Task<(int, int)> Counts(IServiceProvider sp)
    {
        var db = sp.GetRequiredService<AppDbContext>();
        return (await db.Users.CountAsync(), await db.Tiles.CountAsync());
    }

    public void Dispose() => database.Dispose();
}
