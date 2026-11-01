using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Ingresso.Api.Tests.IdentityProvider;
using Ingresso.Api.Tests.Infrastructure;
using Ingresso.Domain.Entities;

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
}
