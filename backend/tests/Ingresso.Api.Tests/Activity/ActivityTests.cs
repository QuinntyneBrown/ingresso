using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using Ingresso.Api.Tests.IdentityProvider;
using Ingresso.Api.Tests.Infrastructure;
using Ingresso.Application.Activity;
using Ingresso.Application.SigningKeys;
using Ingresso.Domain.Entities;
using Ingresso.Domain.Enums;

namespace Ingresso.Api.Tests.Activity;

/// <summary>L2-141 to L2-145: security events are recorded, and each person reviews their own.</summary>
public sealed class ActivityTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private const string MacChrome =
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

    private static string NewEmail() => $"person-{Guid.NewGuid():N}@example.com";

    /// <summary>
    /// A browser on a Mac, signed in as a new person: an administrator (the test seam creates those), or a member whose
    /// verified account is created first.
    /// </summary>
    private async Task<HttpClient> SignedInAsync(string email, bool administrator = true)
    {
        if (!administrator)
        {
            await factory.WithDbAsync(db =>
            {
                db.Users.Add(User.CreateMember(email, ApiFactory.Today));
                db.VerifiedEmails.Add(new VerifiedEmail { NormalizedEmail = email, VerifiedAtUtc = ApiFactory.Today });
                return db.SaveChangesAsync();
            });
        }

        var browser = factory.CreateHttpsClient();
        browser.DefaultRequestHeaders.UserAgent.ParseAdd(MacChrome);
        await browser.SignInAsAsync(email, administrator);
        return browser;
    }

    private static async Task<JsonElement> ActivityAsync(HttpClient browser, string query = "") =>
        await browser.GetFromJsonAsync<JsonElement>($"/api/activity{query}");

    private static List<(string Type, string Subject)> Events(JsonElement page) =>
        page.GetProperty("events").EnumerateArray()
            .Select(e => (e.GetProperty("type").GetString()!, e.GetProperty("subject").GetString()!))
            .ToList();

    // Acceptance Test
    // Traces to: L2-141, L2-142
    // Description: Signing in to ingresso records a "signed in" event with the device, which the person sees in their activity.
    [Fact]
    public async Task Signing_in_records_an_event_with_the_device()
    {
        var browser = await SignedInAsync(NewEmail());

        var page = await ActivityAsync(browser);

        var only = Assert.Single(page.GetProperty("events").EnumerateArray());
        Assert.Equal("signed-in", only.GetProperty("type").GetString());
        Assert.Equal("sign-ins", only.GetProperty("category").GetString());
        Assert.Equal("Chrome on macOS", only.GetProperty("subject").GetString());
        Assert.Equal(ApiFactory.Today, only.GetProperty("occurredAt").GetDateTimeOffset());
        Assert.Equal(JsonValueKind.Null, page.GetProperty("next").ValueKind);
    }

    // Acceptance Test
    // Traces to: L2-141, L2-142
    // Description: Signing in to an app records a "signed in to an app" event naming it, newest first.
    [Fact]
    public async Task Signing_in_to_an_app_records_an_event_naming_it()
    {
        var app = await RelyingParty.RegisterAsync(factory, "Notes");
        var browser = await SignedInAsync(NewEmail());

        await app.SignInAsync(browser);

        var events = Events(await ActivityAsync(browser));
        Assert.Equal(["signed-in-to-app", "signed-in"], events.Select(e => e.Type));
        Assert.StartsWith("Notes ", events[0].Subject);
    }

    // Acceptance Test
    // Traces to: L2-142
    // Description: A person never sees another person's events.
    [Fact]
    public async Task A_person_sees_only_their_own_events()
    {
        var someone = await SignedInAsync(NewEmail());
        await (await RelyingParty.RegisterAsync(factory)).SignInAsync(someone);

        var browser = await SignedInAsync(NewEmail(), administrator: false);

        Assert.Equal([("signed-in", "Chrome on macOS")], Events(await ActivityAsync(browser)));
    }

    // Acceptance Test
    // Traces to: L2-142
    // Description: Activity needs a signed-in person.
    [Fact]
    public async Task Activity_needs_a_signed_in_person()
    {
        var response = await factory.CreateHttpsClient().GetAsync("/api/activity");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    private const string IPhoneSafari =
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1";

    /// <summary>Approves the app on the consent page and returns the name the person saw.</summary>
    private static async Task<string> ApproveAsync(HttpClient browser, RelyingParty app)
    {
        (await browser.PostAsJsonAsync("/api/consent", new { clientId = app.ClientId, scope = "openid profile" })).EnsureSuccessStatusCode();
        var connected = await browser.GetFromJsonAsync<JsonElement>("/api/connected-apps");
        return connected.EnumerateArray().Single().GetProperty("name").GetString()!;
    }

    // Acceptance Test
    // Traces to: L2-141
    // Description: Approving an app on the consent page records an "approved" event naming it.
    [Fact]
    public async Task Approving_an_app_records_an_event()
    {
        var app = await RelyingParty.RegisterAskingConsentAsync(factory);
        var browser = await SignedInAsync(NewEmail());

        var name = await ApproveAsync(browser, app);

        Assert.Equal(("app-approved", name), Events(await ActivityAsync(browser))[0]);
    }

    // Acceptance Test
    // Traces to: L2-141
    // Description: Choosing Deny on the consent page records a "denied" event naming the app.
    [Fact]
    public async Task Denying_an_app_records_an_event()
    {
        var app = await RelyingParty.RegisterAskingConsentAsync(factory);
        var browser = await SignedInAsync(NewEmail());

        await browser.GetAsync(app.AuthorizePath(new Dictionary<string, string?> { ["scope"] = "openid profile", ["consent"] = "deny" }));

        var latest = Events(await ActivityAsync(browser))[0];
        Assert.Equal("app-denied", latest.Type);
        Assert.False(string.IsNullOrWhiteSpace(latest.Subject));
    }

    // Acceptance Test
    // Traces to: L2-141
    // Description: Revoking an app's access records a "revoked" event naming it.
    [Fact]
    public async Task Revoking_an_app_records_an_event()
    {
        var app = await RelyingParty.RegisterAskingConsentAsync(factory);
        var browser = await SignedInAsync(NewEmail());
        var name = await ApproveAsync(browser, app);

        (await browser.DeleteAsync($"/api/connected-apps/{app.ClientId}")).EnsureSuccessStatusCode();

        Assert.Equal(("app-access-revoked", name), Events(await ActivityAsync(browser))[0]);
    }

    // Acceptance Test
    // Traces to: L2-141
    // Description: Ending another session records an event naming its device; signing out of all other devices records one too.
    [Fact]
    public async Task Ending_sessions_records_events()
    {
        var email = NewEmail();
        var mac = await SignedInAsync(email);
        var phone = factory.CreateHttpsClient();
        phone.DefaultRequestHeaders.UserAgent.ParseAdd(IPhoneSafari);
        await phone.SignInAsAsync(email, administrator: true);
        var other = (await mac.GetFromJsonAsync<JsonElement>("/api/sessions")).EnumerateArray()
            .Single(d => !d.GetProperty("current").GetBoolean()).GetProperty("id").GetString();

        (await mac.DeleteAsync($"/api/sessions/{other}")).EnsureSuccessStatusCode();
        await factory.CreateHttpsClient().SignInAsAsync(email, administrator: true);
        (await mac.DeleteAsync("/api/sessions/others")).EnsureSuccessStatusCode();

        var events = Events(await ActivityAsync(mac));
        Assert.Equal(("other-sessions-ended", ""), events[0]);
        Assert.Equal("signed-in", events[1].Type);
        Assert.Equal(("session-ended", "Safari on iPhone"), events[2]);
    }

    private Task<Guid> UserIdAsync(string email) =>
        factory.WithDbAsync(db => db.Users.Where(u => u.Email == email).Select(u => u.Id).SingleAsync());

    private async Task AddEventsAsync(Guid userId, ActivityEventType type, int count) =>
        await factory.WithDbAsync(db =>
        {
            for (var i = 0; i < count; i++)
            {
                db.ActivityEvents.Add(new ActivityEvent { UserId = userId, Type = type, Subject = $"App {i}", OccurredAtUtc = ApiFactory.Today });
            }

            return db.SaveChangesAsync();
        });

    // Acceptance Test
    // Traces to: L2-144
    // Description: Activity comes 20 events at a time, newest first; the next page continues where the last ended.
    [Fact]
    public async Task Activity_pages_twenty_events_at_a_time()
    {
        var email = NewEmail();
        var browser = await SignedInAsync(email);
        await AddEventsAsync(await UserIdAsync(email), ActivityEventType.AppApproved, 24);

        var first = await ActivityAsync(browser);
        var second = await ActivityAsync(browser, $"?before={first.GetProperty("next").GetInt64()}");

        Assert.Equal(20, first.GetProperty("events").GetArrayLength());
        Assert.Equal("App 23", Events(first)[0].Subject);
        Assert.Equal(
            [("app-approved", "App 3"), ("app-approved", "App 2"), ("app-approved", "App 1"), ("app-approved", "App 0"), ("signed-in", "Chrome on macOS")],
            Events(second));
        Assert.Equal(JsonValueKind.Null, second.GetProperty("next").ValueKind);
    }

    // Acceptance Test
    // Traces to: L2-144
    // Description: Activity filters by type; an unknown type is refused.
    [Fact]
    public async Task Activity_filters_by_type()
    {
        var email = NewEmail();
        var browser = await SignedInAsync(email);
        var userId = await UserIdAsync(email);
        await AddEventsAsync(userId, ActivityEventType.AppDenied, 1);
        await AddEventsAsync(userId, ActivityEventType.SessionEnded, 1);

        Assert.Equal([("app-denied", "App 0")], Events(await ActivityAsync(browser, "?category=app-access")));
        Assert.Equal([("session-ended", "App 0")], Events(await ActivityAsync(browser, "?category=sessions")));
        Assert.Equal([("signed-in", "Chrome on macOS")], Events(await ActivityAsync(browser, "?category=sign-ins")));
        Assert.Equal(HttpStatusCode.BadRequest, (await browser.GetAsync("/api/activity?category=everything")).StatusCode);
    }

    private static async Task<List<JsonElement>> ChangesAsync(HttpClient browser) =>
        (await ActivityAsync(browser, "?category=apps-and-keys")).GetProperty("events").EnumerateArray().ToList();

    // Acceptance Test
    // Traces to: L2-143
    // Description: Registering, editing, rotating the secret of, disabling, enabling and deleting an app record events naming the app and the administrator; another administrator sees them, a member never does.
    [Fact]
    public async Task App_changes_are_recorded_for_administrators_only()
    {
        var adminEmail = NewEmail();
        var admin = await SignedInAsync(adminEmail);
        var name = $"Budget {Guid.NewGuid():N}"[..15];
        var registered = await admin.PostAsJsonAsync("/api/clients", new
        {
            name,
            redirectUris = new[] { "https://budget.example.com/signin-oidc" },
            confidential = true,
        });
        var clientId = (await registered.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("client").GetProperty("clientId").GetString();
        (await admin.PutAsJsonAsync($"/api/clients/{clientId}", new
        {
            name,
            redirectUris = new[] { "https://budget.example.com/signin-oidc" },
            postLogoutRedirectUris = Array.Empty<string>(),
            scopes = Array.Empty<string>(),
            offlineAccess = false,
            firstParty = true,
        })).EnsureSuccessStatusCode();
        (await admin.PostAsync($"/api/clients/{clientId}/secret", null)).EnsureSuccessStatusCode();
        (await admin.PostAsync($"/api/clients/{clientId}/disable", null)).EnsureSuccessStatusCode();
        (await admin.PostAsync($"/api/clients/{clientId}/enable", null)).EnsureSuccessStatusCode();
        (await admin.DeleteAsync($"/api/clients/{clientId}")).EnsureSuccessStatusCode();

        var another = await SignedInAsync(NewEmail());
        var member = await SignedInAsync(NewEmail(), administrator: false);

        var mine = (await ChangesAsync(another)).Where(e => e.GetProperty("subject").GetString() == name).ToList();
        Assert.Equal(
            ["app-deleted", "app-enabled", "app-disabled", "app-secret-rotated", "app-updated", "app-registered"],
            mine.Select(e => e.GetProperty("type").GetString()));
        Assert.All(mine, e => Assert.Equal(adminEmail, e.GetProperty("actor").GetString()));
        Assert.All(mine, e => Assert.Equal("apps-and-keys", e.GetProperty("category").GetString()));
        Assert.Empty(await ChangesAsync(member));
        Assert.DoesNotContain(Events(await ActivityAsync(member)), e => e.Subject == name);
    }

    // Acceptance Test
    // Traces to: L2-143
    // Description: A signing key rotation from the CLI is recorded with no administrator.
    [Fact]
    public async Task A_key_rotation_from_the_cli_is_recorded()
    {
        var admin = await SignedInAsync(NewEmail());
        using (var scope = factory.Services.CreateScope())
        {
            await scope.ServiceProvider.GetRequiredService<IMediator>().Send(new RotateSigningKeyCommand());
        }

        var latest = (await ChangesAsync(admin)).First();
        Assert.Equal("signing-key-rotated", latest.GetProperty("type").GetString());
        Assert.Equal("", latest.GetProperty("subject").GetString());
        Assert.Equal(JsonValueKind.Null, latest.GetProperty("actor").ValueKind);
    }

    // Acceptance Test
    // Traces to: L2-145
    // Description: Pruning deletes events older than the 90-day retention period and keeps newer ones.
    [Fact]
    public async Task Pruning_deletes_events_past_retention()
    {
        var email = NewEmail();
        await SignedInAsync(email);
        var userId = await UserIdAsync(email);
        await factory.WithDbAsync(db =>
        {
            db.ActivityEvents.Add(new ActivityEvent { UserId = userId, Type = ActivityEventType.AppApproved, Subject = "Old", OccurredAtUtc = ApiFactory.Today.AddDays(-91) });
            db.ActivityEvents.Add(new ActivityEvent { UserId = userId, Type = ActivityEventType.AppApproved, Subject = "Recent", OccurredAtUtc = ApiFactory.Today.AddDays(-89) });
            return db.SaveChangesAsync();
        });

        using (var scope = factory.Services.CreateScope())
        {
            await scope.ServiceProvider.GetRequiredService<IMediator>().Send(new PruneActivityCommand());
        }

        var subjects = await factory.WithDbAsync(db => db.ActivityEvents.Where(e => e.UserId == userId).Select(e => e.Subject).ToListAsync());
        Assert.Contains("Recent", subjects);
        Assert.DoesNotContain("Old", subjects);
    }
}
