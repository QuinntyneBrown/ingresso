using Ingresso.Application.Clients;
using Ingresso.Application.Resources;
using Ingresso.Application.Tiles;
using Microsoft.Extensions.Options;
using Microsoft.EntityFrameworkCore;
using Ingresso.Application.Common.Interfaces;
using Ingresso.Domain.Entities;
using Ingresso.Domain.Enums;
using Ingresso.Infrastructure.Persistence;

namespace Ingresso.Infrastructure.Seeding;

/// <summary>
/// Adds a dev user and sample tiles, and the sample relying party when configured. Rows that already exist (by email,
/// tile name per user, or client ID) are left alone, so it is safe to re-run.
/// </summary>
public sealed class DatabaseSeeder(
    AppDbContext db, IClock clock, IClientRegistry clients, IResourceRegistry resources, IOptions<SampleAppOptions> sampleApp)
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

        // The seeded person has proved their inbox, so the tile endpoints answer for them (L2-029).
        var email = SeedData.UserEmail.ToLowerInvariant();
        if (!await db.VerifiedEmails.AnyAsync(v => v.NormalizedEmail == email, cancellationToken))
        {
            db.VerifiedEmails.Add(new VerifiedEmail { NormalizedEmail = email, VerifiedAtUtc = now });
        }

        var placed = await db.Tiles.Where(t => t.OwnerId == user.Id).ToListAsync(cancellationToken);
        var names = placed.Select(t => t.Name).ToHashSet(StringComparer.OrdinalIgnoreCase);
        var order = placed.Count;
        foreach (var seed in SeedData.Tiles.Where(s => !names.Contains(s.Name)))
        {
            // Large tiles take 4 by 3 and small ones 3 by 2, placed in reading order (L2-009).
            var (cols, rows) = seed.Recent ? (4, 3) : (TileLayout.DefaultCols, TileLayout.DefaultRows);
            var (x, y) = TileLayout.FirstFree(placed, cols, rows);
            var tile = new Tile
            {
                OwnerId = user.Id, Name = seed.Name, Url = seed.Url, Description = seed.Description, Color = seed.Color,
                Initial = seed.Initial, Category = seed.Category, CreatedAt = now.AddSeconds(order++),
                X = x, Y = y, Cols = cols, Rows = rows,
            };
            placed.Add(tile);
            db.Tiles.Add(tile);
        }

        await db.SaveChangesAsync(cancellationToken);
        await SeedSampleAppAsync(cancellationToken);
    }

    /// <summary>
    /// Registers the sample app's API (journey 17) and the sample relying party (journey 16) under its fixed client ID,
    /// allowed that API's scope, once each.
    /// </summary>
    private async Task SeedSampleAppAsync(CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(sampleApp.Value.BaseUrl))
        {
            return;
        }

        if ((await resources.ListAsync(cancellationToken)).All(r => r.Audience != SampleAppOptions.Audience))
        {
            await resources.RegisterAsync(new ResourceDto("Sample API", SampleAppOptions.Audience, [SampleAppOptions.Scope]), cancellationToken);
        }

        if (await clients.FindNameAsync(SampleAppOptions.ClientId, cancellationToken) is not null)
        {
            return;
        }

        var baseUrl = sampleApp.Value.BaseUrl.TrimEnd('/');
        await clients.RegisterAsync(
            new NewClient(
                "Sample app", [$"{baseUrl}/signin-oidc"], [$"{baseUrl}/signout-callback-oidc"], SampleAppOptions.ClientId, [SampleAppOptions.Scope],
                $"{baseUrl}/frontchannel-logout"),
            cancellationToken);
    }
}
