using MediatR;
using Ingresso.Application.SigningKeys;
using Ingresso.Infrastructure.Identity;

namespace Ingresso.Api.Auth;

/// <summary>
/// Every <c>IdentityProvider:SigningKeys:RefreshInterval</c> (a minute by default) rotates the signing key when the
/// configured rotation interval has passed (L2-140), then reloads the keys, so a <c>keys rotate</c> from the CLI
/// reaches a running API without a restart (L2-137).
/// </summary>
public sealed class SigningKeyMaintenance(
    SigningKeyRing ring, IServiceScopeFactory scopes, IConfiguration configuration, ILogger<SigningKeyMaintenance> logger)
    : BackgroundService
{
    private readonly TimeSpan interval = configuration.GetValue<TimeSpan?>("IdentityProvider:SigningKeys:RefreshInterval") ?? TimeSpan.FromMinutes(1);

    /// <summary>One check: rotates if due, then reloads the keys.</summary>
    public async Task RunOnceAsync(CancellationToken cancellationToken)
    {
        using (var scope = scopes.CreateScope())
        {
            var rotated = await scope.ServiceProvider.GetRequiredService<ISender>().Send(new RotateIfDueCommand(), cancellationToken);
            if (rotated is not null)
            {
                logger.LogInformation("Rotated the signing key on schedule; the active key is now {Kid}.", rotated.ActiveKid);
            }
        }

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
