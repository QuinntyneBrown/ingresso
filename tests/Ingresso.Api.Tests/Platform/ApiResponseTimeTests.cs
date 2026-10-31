using System.Diagnostics;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Ingresso.Api.Tests.Infrastructure;
using Ingresso.Domain.Entities;
using Ingresso.Domain.Enums;

namespace Ingresso.Api.Tests.Platform;

public sealed class ApiResponseTimeTests
{
    private const int Runs = 100;
    private static readonly TimeSpan Limit = TimeSpan.FromMilliseconds(200);

    private sealed class PerfFactory : ApiFactory
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            base.ConfigureWebHost(builder);
            builder.UseSetting("RateLimit:ApiPerMinute", "100000");
        }
    }

    private static async Task<TimeSpan> P95(Func<int, Task> request)
    {
        var timings = new List<TimeSpan>();
        for (var i = 0; i < Runs; i++)
        {
            var clock = Stopwatch.StartNew();
            await request(i);
            timings.Add(clock.Elapsed);
        }

        return timings.Order().ElementAt((int)Math.Ceiling(Runs * 0.95) - 1);
    }

    // Acceptance Test
    // Traces to: L2-039
    // Description: With 200 tiles, list, create, edit, delete and layout requests each have a p95 under 200 ms.
    [PerfFact]
    [Trait("Category", "Performance")]
    public async Task Tile_requests_have_a_p95_under_200_ms_with_200_tiles()
    {
        using var factory = new PerfFactory();
        const string email = "perf@ingresso.dev";
        var tileIds = await factory.WithDbAsync(async db =>
        {
            var user = new User { Email = email, Role = UserRole.Member, CreatedAtUtc = ApiFactory.Today };
            db.Users.Add(user);
            var tiles = Enumerable.Range(0, 200).Select(i => new Tile
            {
                OwnerId = user.Id, Name = $"App {i}", Url = $"https://app{i}.example.com/", Color = "#2563EB", Initial = "A",
                CreatedAt = ApiFactory.Today.AddSeconds(i), X = i % 4 * 3, Y = i / 4 * 2, Cols = 3, Rows = 2,
            }).ToList();
            db.Tiles.AddRange(tiles);
            await db.SaveChangesAsync();
            return tiles.Select(t => t.Id).ToList();
        });
        var client = factory.CreateHttpsClient();
        await client.SignInAsAsync(email);
        var layout = new { tiles = tileIds.Select((id, i) => new { id, x = i % 4 * 3, y = i / 4 * 2, cols = 3, rows = 2 }) };
        var created = new List<string>();

        var results = new Dictionary<string, TimeSpan>
        {
            ["list"] = await P95(_ => client.GetAsync("/api/tiles")),
            ["create"] = await P95(async i =>
            {
                var response = await client.PostAsJsonAsync("/api/tiles", new { name = $"New {i}", url = $"https://new{i}.example.com", color = "#2563EB" });
                created.Add((await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString()!);
            }),
            ["edit"] = await P95(i => client.PutAsJsonAsync($"/api/tiles/{tileIds[i]}", new { name = $"Edited {i}", url = "https://edited.example.com", color = "#6D28D9" })),
            ["layout"] = await P95(_ => client.PutAsJsonAsync("/api/tiles/layout", layout)),
            ["delete"] = await P95(i => client.DeleteAsync($"/api/tiles/{created[i]}")),
        };

        foreach (var (name, p95) in results)
        {
            Assert.True(p95 < Limit, $"{name} p95 was {p95.TotalMilliseconds:F0} ms; the limit is 200 ms.");
        }
    }
}
