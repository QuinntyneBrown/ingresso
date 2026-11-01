using OpenIddict.Abstractions;

namespace Ingresso.Api.Auth;

/// <summary>
/// Removes tokens and authorizations that are expired, revoked or redeemed once a day, so the stores hold only what can
/// still be used (L2-109). Off in tests (<c>IdentityProvider:Pruning:Enabled</c>).
/// </summary>
public sealed class TokenPruningService(IServiceScopeFactory scopes) : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromDays(1);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(Interval);
        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            // Entries from the last day stay, so a token being used right now is never removed under it.
            await PruneAsync(DateTimeOffset.UtcNow - Interval, stoppingToken);
        }
    }

    /// <summary>Prunes entries created before <paramref name="threshold"/> that can no longer be used.</summary>
    public async Task PruneAsync(DateTimeOffset threshold, CancellationToken cancellationToken)
    {
        using var scope = scopes.CreateScope();
        await scope.ServiceProvider.GetRequiredService<IOpenIddictTokenManager>().PruneAsync(threshold, cancellationToken);
        await scope.ServiceProvider.GetRequiredService<IOpenIddictAuthorizationManager>().PruneAsync(threshold, cancellationToken);
    }
}
