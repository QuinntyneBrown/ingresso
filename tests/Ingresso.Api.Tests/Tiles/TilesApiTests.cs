using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Ingresso.Api.Tests.Infrastructure;
using Ingresso.Domain.Entities;
using Ingresso.Domain.Enums;

namespace Ingresso.Api.Tests.Tiles;

public sealed class TilesApiTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private static object Body(string name = "Jira", string url = "jira.example.com", string color = "#0052cc") =>
        new { name, url, color, description = "Tickets", category = "Work" };

    private async Task<HttpClient> SignedIn(string email = HttpClientExtensions.DevUser)
    {
        await factory.WithDbAsync(async db =>
        {
            if (!await db.Users.AnyAsync(u => u.Email == email))
            {
                db.Users.Add(new User { Email = email, Role = UserRole.Member, CreatedAtUtc = ApiFactory.Today });
                await db.SaveChangesAsync();
            }

            return 0;
        });
        var client = factory.CreateHttpsClient();
        await client.SignInAsAsync(email);
        return client;
    }

    private static async Task<JsonElement> Json(HttpResponseMessage r) => await r.Content.ReadFromJsonAsync<JsonElement>();

    [Fact]
    public async Task Anonymous_callers_get_401()
    {
        Assert.Equal(HttpStatusCode.Unauthorized, (await factory.CreateHttpsClient().GetAsync("/api/tiles")).StatusCode);
    }

    // Acceptance Test
    // Traces to: L2-009
    // Description: Tiles list in reading order and carry their placement and span, not a separate size or sort order.
    [Fact]
    public async Task Lists_the_seeded_tiles_in_reading_order_with_placement_and_no_size_or_sort_order()
    {
        var client = await SignedIn();

        var tiles = await client.GetFromJsonAsync<JsonElement>("/api/tiles");

        Assert.True(tiles.GetArrayLength() >= 11);
        Assert.Equal("Gmail", tiles[0].GetProperty("name").GetString());
        Assert.Equal(4, tiles[0].GetProperty("cols").GetInt32());
        Assert.Equal(3, tiles[0].GetProperty("rows").GetInt32());
        Assert.False(tiles[0].TryGetProperty("size", out _));
        Assert.False(tiles[0].TryGetProperty("sortOrder", out _));
        var reading = tiles.EnumerateArray().Select(t => (t.GetProperty("y").GetInt32(), t.GetProperty("x").GetInt32())).ToList();
        Assert.Equal(reading.OrderBy(c => c.Item1).ThenBy(c => c.Item2), reading);
    }

    [Fact]
    public async Task Create_normalizes_the_url_defaults_the_initial_and_appends()
    {
        var client = await SignedIn();

        var response = await client.PostAsJsonAsync("/api/tiles", Body());

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var tile = await Json(response);
        Assert.Equal("https://jira.example.com/", tile.GetProperty("url").GetString());
        Assert.Equal("J", tile.GetProperty("initial").GetString());
        var all = await client.GetFromJsonAsync<JsonElement>("/api/tiles");
        Assert.Equal(tile.GetProperty("id").GetString(), all[all.GetArrayLength() - 1].GetProperty("id").GetString());
    }

    // Acceptance Test
    // Traces to: L2-009
    // Description: A new tile takes a 3 by 2 span at the first free cell in reading order.
    [Fact]
    public async Task Create_places_the_tile_at_the_first_free_cell_with_the_default_span()
    {
        var client = await SignedIn("placement@ingresso.dev");
        var placed = new List<JsonElement>();
        foreach (var n in new[] { "A", "B", "C", "D", "E" })
        {
            placed.Add(await Json(await client.PostAsJsonAsync("/api/tiles", Body(n))));
        }

        int[][] expected = [[0, 0], [3, 0], [6, 0], [9, 0], [0, 2]];
        for (var i = 0; i < expected.Length; i++)
        {
            Assert.Equal(expected[i][0], placed[i].GetProperty("x").GetInt32());
            Assert.Equal(expected[i][1], placed[i].GetProperty("y").GetInt32());
            Assert.Equal(3, placed[i].GetProperty("cols").GetInt32());
            Assert.Equal(2, placed[i].GetProperty("rows").GetInt32());
        }

        var listed = await client.GetFromJsonAsync<JsonElement>("/api/tiles");
        Assert.Equal(0, listed[4].GetProperty("x").GetInt32());
        Assert.Equal(2, listed[4].GetProperty("y").GetInt32());
    }

    // Acceptance Test
    // Traces to: L2-001
    // Description: A tile's icon initials may be one or two characters, as the form offers.
    [Fact]
    public async Task Create_accepts_two_character_initials()
    {
        var client = await SignedIn();

        var response = await client.PostAsJsonAsync("/api/tiles", new { name = "Team Mail", url = "mail.example.com", color = "#0052cc", initial = "TM" });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.Equal("TM", (await Json(response)).GetProperty("initial").GetString());
    }

    [Fact]
    public async Task Get_update_and_delete_round_trip()
    {
        var client = await SignedIn();
        var created = await Json(await client.PostAsJsonAsync("/api/tiles", Body("Round trip")));
        var id = created.GetProperty("id").GetString();

        var updated = await client.PutAsJsonAsync($"/api/tiles/{id}", new { name = "Renamed", url = "https://renamed.example.com", color = "#112233" });
        var fetched = await client.GetFromJsonAsync<JsonElement>($"/api/tiles/{id}");
        var deleted = await client.DeleteAsync($"/api/tiles/{id}");
        var gone = await client.GetAsync($"/api/tiles/{id}");

        Assert.Equal(HttpStatusCode.OK, updated.StatusCode);
        Assert.Equal("Renamed", fetched.GetProperty("name").GetString());
        Assert.Equal(HttpStatusCode.NoContent, deleted.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, gone.StatusCode);
    }

    [Theory]
    [InlineData("", "app.example.com", "#000000", "name")]
    [InlineData("Valid", "javascript:alert(1)", "#000000", "url")]
    [InlineData("Valid", "not a url", "#000000", "url")]
    [InlineData("Valid", "ftp://example.com", "#000000", "url")]
    [InlineData("Valid", "app.example.com", "red", "color")]
    public async Task Invalid_input_is_rejected_with_field_errors(string name, string url, string color, string field)
    {
        var client = await SignedIn();

        var response = await client.PostAsJsonAsync("/api/tiles", Body(name, url, color));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.True((await Json(response)).GetProperty("errors").TryGetProperty(field, out _));
    }

    [Fact]
    public async Task A_name_over_80_characters_is_rejected()
    {
        var client = await SignedIn();

        var response = await client.PostAsJsonAsync("/api/tiles", Body(new string('a', 81)));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Users_cannot_see_or_change_each_others_tiles()
    {
        var owner = await SignedIn();
        var intruder = await SignedIn(HttpClientExtensions.OtherUser);
        var created = await Json(await owner.PostAsJsonAsync("/api/tiles", Body("Private")));
        var id = created.GetProperty("id").GetString();

        Assert.Equal(HttpStatusCode.NotFound, (await intruder.GetAsync($"/api/tiles/{id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await intruder.PutAsJsonAsync($"/api/tiles/{id}", Body())).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await intruder.DeleteAsync($"/api/tiles/{id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await intruder.PostAsync($"/api/tiles/{id}/opened", null)).StatusCode);
        var theirs = await intruder.GetFromJsonAsync<JsonElement>("/api/tiles");
        Assert.DoesNotContain(theirs.EnumerateArray(), t => t.GetProperty("id").GetString() == id);
        Assert.Equal(HttpStatusCode.OK, (await owner.GetAsync($"/api/tiles/{id}")).StatusCode);
    }

    private async Task<(HttpClient Client, string[] Ids)> ThreeTiles(string email)
    {
        var client = await SignedIn(email);
        var ids = new List<string>();
        foreach (var n in new[] { "A", "B", "C" })
        {
            ids.Add((await Json(await client.PostAsJsonAsync("/api/tiles", Body(n)))).GetProperty("id").GetString()!);
        }

        return (client, ids.ToArray());
    }

    private static object Placement(string id, int x, int y, int cols = 3, int rows = 2) => new { id, x, y, cols, rows };

    // Acceptance Test
    // Traces to: L2-052
    // Description: A complete, valid layout is stored as one request.
    [Fact]
    public async Task Save_layout_stores_every_position_and_span()
    {
        var (client, ids) = await ThreeTiles("layout-ok@ingresso.dev");

        var response = await client.PutAsJsonAsync("/api/tiles/layout", new
        {
            tiles = new[] { Placement(ids[0], 0, 4, 6, 3), Placement(ids[1], 6, 4, 2, 1), Placement(ids[2], 0, 0, 12, 4) },
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var listed = (await client.GetFromJsonAsync<JsonElement>("/api/tiles")).EnumerateArray().ToDictionary(t => t.GetProperty("id").GetString()!);
        Assert.Equal((0, 4, 6, 3), Rect(listed[ids[0]]));
        Assert.Equal((6, 4, 2, 1), Rect(listed[ids[1]]));
        Assert.Equal((0, 0, 12, 4), Rect(listed[ids[2]]));
    }

    private static (int, int, int, int) Rect(JsonElement t) =>
        (t.GetProperty("x").GetInt32(), t.GetProperty("y").GetInt32(), t.GetProperty("cols").GetInt32(), t.GetProperty("rows").GetInt32());

    // Acceptance Test
    // Traces to: L2-052, L2-051
    // Description: Incomplete, repeated, foreign, overlapping, out-of-bounds and out-of-limit layouts are rejected unchanged.
    [Theory]
    [InlineData("omits")]
    [InlineData("repeats")]
    [InlineData("foreign")]
    [InlineData("overlaps")]
    [InlineData("past-column-12")]
    [InlineData("too-narrow")]
    [InlineData("too-tall")]
    public async Task Save_layout_rejects_an_invalid_layout(string fault)
    {
        var (client, ids) = await ThreeTiles($"layout-{fault}@ingresso.dev");
        var before = await client.GetStringAsync("/api/tiles");
        object[] tiles = fault switch
        {
            "omits" => [Placement(ids[0], 0, 0), Placement(ids[1], 3, 0)],
            "repeats" => [Placement(ids[0], 0, 0), Placement(ids[1], 3, 0), Placement(ids[1], 6, 0)],
            "foreign" => [Placement(ids[0], 0, 0), Placement(ids[1], 3, 0), Placement(Guid.NewGuid().ToString(), 6, 0)],
            "overlaps" => [Placement(ids[0], 0, 0), Placement(ids[1], 2, 1), Placement(ids[2], 6, 0)],
            "past-column-12" => [Placement(ids[0], 0, 0), Placement(ids[1], 3, 0), Placement(ids[2], 10, 0)],
            "too-narrow" => [Placement(ids[0], 0, 0, 1, 2), Placement(ids[1], 3, 0), Placement(ids[2], 6, 0)],
            _ => [Placement(ids[0], 0, 0, 3, 9), Placement(ids[1], 3, 0), Placement(ids[2], 6, 0)],
        };

        var response = await client.PutAsJsonAsync("/api/tiles/layout", new { tiles });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal(before, await client.GetStringAsync("/api/tiles"));
    }

    // Acceptance Test
    // Traces to: L2-019
    // Description: Reset packs tiles in creation order at 3 by 2, four per row, and edits nothing else.
    [Fact]
    public async Task Reset_layout_packs_tiles_in_creation_order()
    {
        var client = await SignedIn("reset-pack@ingresso.dev");
        var ids = new List<string>();
        foreach (var n in new[] { "A", "B", "C", "D", "E" })
        {
            ids.Add((await Json(await client.PostAsJsonAsync("/api/tiles", Body(n)))).GetProperty("id").GetString()!);
        }

        await client.PutAsJsonAsync("/api/tiles/layout", new
        {
            tiles = ids.Select((id, i) => Placement(id, 0, i * 3, 6, 3)).ToArray(),
        });
        var reset = await client.PostAsync("/api/tiles/reset-layout", null);

        Assert.Equal(HttpStatusCode.OK, reset.StatusCode);
        var listed = (await client.GetFromJsonAsync<JsonElement>("/api/tiles")).EnumerateArray().ToDictionary(t => t.GetProperty("name").GetString()!);
        Assert.Equal((0, 0, 3, 2), Rect(listed["A"]));
        Assert.Equal((3, 0, 3, 2), Rect(listed["B"]));
        Assert.Equal((6, 0, 3, 2), Rect(listed["C"]));
        Assert.Equal((9, 0, 3, 2), Rect(listed["D"]));
        Assert.Equal((0, 2, 3, 2), Rect(listed["E"]));
        Assert.Equal(5, listed.Count);
        Assert.All(listed.Values, t => Assert.Equal("https://jira.example.com/", t.GetProperty("url").GetString()));
    }

    [Fact]
    public async Task Mark_opened_stamps_the_last_opened_time()
    {
        var client = await SignedIn();
        var created = await Json(await client.PostAsJsonAsync("/api/tiles", Body("Opened")));
        Assert.Equal(JsonValueKind.Null, created.GetProperty("lastOpenedAt").ValueKind);

        var response = await client.PostAsync($"/api/tiles/{created.GetProperty("id").GetString()}/opened", null);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(ApiFactory.Today, (await Json(response)).GetProperty("lastOpenedAt").GetDateTimeOffset());
    }

    [Fact]
    public async Task Writes_without_the_xsrf_token_are_rejected()
    {
        var client = await SignedIn();
        client.DefaultRequestHeaders.Remove("X-XSRF-TOKEN");

        var response = await client.PostAsJsonAsync("/api/tiles", Body());

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
