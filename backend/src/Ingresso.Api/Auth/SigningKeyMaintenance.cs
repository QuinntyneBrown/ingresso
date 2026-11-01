using Ingresso.Infrastructure.Identity;

namespace Ingresso.Api.Auth;

/// <summary>
/// Reloads the signing keys every <c>IdentityProvider:SigningKeys:RefreshInterval</c> (a minute by default), so a
/// <c>keys rotate</c> from the CLI reaches a running API without a restart (L2-137).
/// </summary>
public sealed class SigningKeyMaintenance(SigningKeyRing ring, IConfiguration configuration, ILogger<SigningKeyMaintenance> logger)
    : BackgroundService
{
    private readonly TimeSpan interval = configuration.GetValue<TimeSpan?>("IdentityProvider:SigningKeys:RefreshInterval") ?? TimeSpan.FromMinutes(1);

    /// <summary>One check: reloads the keys.</summary>
    public async Task RunOnceAsync(CancellationToken cancellationToken)
    {
        await ring.ReloadAsync(cancellationToken);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(interval);
        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            try
            {
                await RunOnceAsync(stoppingToken);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogWarning(ex, "Signing keys could not be reloaded; trying again in {Interval}.", interval);
            }
        }
    }
}
