using System.Net;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using OpenIddict.Abstractions;
using Ingresso.Api.Auth;
using Ingresso.Api.Tests.Infrastructure;
using Ingresso.Application.Common.Interfaces;
using static OpenIddict.Abstractions.OpenIddictConstants;

namespace Ingresso.Api.Tests.IdentityProvider;

/// <summary>L2-109 and L2-110: refresh token lifetimes, and renewals keeping the session in use, on a clock tests can move.</summary>
public sealed class RefreshTokenLifetimeTests(RefreshTokenLifetimeTests.MovableClockFactory factory)
    : IClassFixture<RefreshTokenLifetimeTests.MovableClockFactory>
{
    /// <summary>The API with a clock each test can move forward.</summary>
    public sealed class MovableClockFactory : ApiFactory
    {
        public MovableClock Clock { get; } = new();

        protected override void ConfigureTestServices(IServiceCollection services) => services.AddSingleton<IClock>(Clock);
    }

    public sealed class MovableClock : IClock
    {
        public DateTimeOffset UtcNow { get; set; } = ApiFactory.Today;
    }

    private static string RefreshTokenIn(JsonElement tokens) => tokens.GetProperty("refresh_token").GetString()!;

    /// <summary>Renews and returns the new refresh token, failing the test if the renewal is refused.</summary>
    private static async Task<string> RenewAsync(RelyingParty app, string refreshToken)
    {
        var response = await app.RefreshAsync(refreshToken);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return RefreshTokenIn(await RelyingParty.JsonAsync(response));
    }

    /// <summary>How long the app's newest usable refresh token lasts, from when it was stored.</summary>
    private async Task<TimeSpan> NewestRefreshTokenLifetimeAsync(RelyingParty app)
    {
        using var scope = factory.Services.CreateScope();
        var applications = scope.ServiceProvider.GetRequiredService<IOpenIddictApplicationManager>();
        var tokens = scope.ServiceProvider.GetRequiredService<IOpenIddictTokenManager>();
        var id = await applications.GetIdAsync((await applications.FindByClientIdAsync(app.ClientId))!);
        await foreach (var token in tokens.FindByApplicationIdAsync(id!))
        {
            if (await tokens.HasTypeAsync(token, TokenTypeIdentifiers.RefreshToken) && await tokens.HasStatusAsync(token, Statuses.Valid))
            {
                return (await tokens.GetExpirationDateAsync(token))!.Value - (await tokens.GetCreationDateAsync(token))!.Value;
            }
        }

        throw new InvalidOperationException("The app has no usable refresh token.");
    }

    private static void AssertAbout(TimeSpan expected, TimeSpan actual) =>
        Assert.InRange(actual, expected - TimeSpan.FromSeconds(5), expected + TimeSpan.FromSeconds(5));

    // Acceptance Test
    // Traces to: L2-109
    // Description: A refresh token lasts 14 days, and each renewal issues one that lasts 14 days from the renewal.
    [Fact]
    public async Task A_refresh_token_lasts_14_days_from_each_renewal()
    {
        factory.Clock.UtcNow = ApiFactory.Today;
        var app = await RelyingParty.RegisterWithOfflineAccessAsync(factory);
        var first = RefreshTokenIn(await app.SignInOfflineAsync());
        AssertAbout(TimeSpan.FromDays(14), await NewestRefreshTokenLifetimeAsync(app));

        await RenewAsync(app, first);

        AssertAbout(TimeSpan.FromDays(14), await NewestRefreshTokenLifetimeAsync(app));
    }

    // Acceptance Test
    // Traces to: L2-109
    // Description: Renewals stop 90 days after the sign-in, and the last token issued before then lasts only until that point.
    [Fact]
    public async Task Renewals_stop_90_days_after_the_sign_in()
    {
        factory.Clock.UtcNow = ApiFactory.Today;
        var app = await RelyingParty.RegisterWithOfflineAccessAsync(factory);
        var refreshToken = RefreshTokenIn(await app.SignInOfflineAsync());

        for (var day = 10; day <= 80; day += 10)
        {
            factory.Clock.UtcNow = ApiFactory.Today.AddDays(day);
            refreshToken = await RenewAsync(app, refreshToken);
        }

        AssertAbout(TimeSpan.FromDays(10), await NewestRefreshTokenLifetimeAsync(app));
        factory.Clock.UtcNow = ApiFactory.Today.AddDays(90);
        var refused = await app.RefreshAsync(refreshToken);
        Assert.Equal(HttpStatusCode.BadRequest, refused.StatusCode);
        Assert.Equal("invalid_grant", (await RelyingParty.JsonAsync(refused)).GetProperty("error").GetString());
    }

    // Acceptance Test
    // Traces to: L2-110
    // Description: Renewing a refresh token counts as using the session it came from.
    [Fact]
    public async Task Renewing_counts_as_using_the_session()
    {
        factory.Clock.UtcNow = ApiFactory.Today;
        var app = await RelyingParty.RegisterWithOfflineAccessAsync(factory);
        var before = await factory.WithDbAsync(db => db.Sessions.Select(s => s.Id).ToListAsync());
        var browser = factory.CreateHttpsClient();
        await browser.SignInAsAsync(HttpClientExtensions.DevUser);
        var refreshToken = RefreshTokenIn(await app.SignInOfflineAsync(browser));

        factory.Clock.UtcNow = ApiFactory.Today.AddDays(13);
        await RenewAsync(app, refreshToken);

        var session = await factory.WithDbAsync(db => db.Sessions.SingleAsync(s => !before.Contains(s.Id)));
        Assert.Equal(ApiFactory.Today.AddDays(13), session.LastSeenAtUtc);
    }

    // Acceptance Test
    // Traces to: L2-109
    // Description: Pruning removes the revoked refresh token and the redeemed code, older than its threshold, and keeps tokens still valid.
    [Fact]
    public async Task Pruning_removes_revoked_tokens()
    {
        factory.Clock.UtcNow = ApiFactory.Today;
        var app = await RelyingParty.RegisterWithOfflineAccessAsync(factory);
        var refreshToken = RefreshTokenIn(await app.SignInOfflineAsync());
        (await app.RevokeAsync(refreshToken)).EnsureSuccessStatusCode();
        Assert.Equal(2, await UnusableTokenCountAsync(app));

        await new TokenPruningService(factory.Services.GetRequiredService<IServiceScopeFactory>())
            .PruneAsync(DateTimeOffset.UtcNow.AddMinutes(1), CancellationToken.None);

        Assert.Equal(0, await UnusableTokenCountAsync(app));
    }

    /// <summary>The app's stored tokens that are revoked, redeemed or otherwise no longer valid.</summary>
    private async Task<int> UnusableTokenCountAsync(RelyingParty app)
    {
        using var scope = factory.Services.CreateScope();
        var applications = scope.ServiceProvider.GetRequiredService<IOpenIddictApplicationManager>();
        var tokens = scope.ServiceProvider.GetRequiredService<IOpenIddictTokenManager>();
        var id = await applications.GetIdAsync((await applications.FindByClientIdAsync(app.ClientId))!);
        var count = 0;
        await foreach (var token in tokens.FindByApplicationIdAsync(id!))
        {
            if (!await tokens.HasStatusAsync(token, Statuses.Valid))
            {
                count++;
            }
        }

        return count;
    }
}
