using System.Globalization;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using Ingresso.Application.SigningKeys;

namespace Ingresso.Cli;

/// <summary>Rotates and lists the keys ingresso signs tokens with (L2-136).</summary>
public static class KeyCommands
{
    public const string Usage = "Usage: ingresso keys <rotate|list>";

    public static async Task<int> RunAsync(string[] args, IServiceProvider services, TextWriter output, CancellationToken cancellationToken)
    {
        using var scope = services.CreateScope();
        var sender = scope.ServiceProvider.GetRequiredService<ISender>();
        switch (args.Length == 1 ? args[0].ToLowerInvariant() : "")
        {
            case "rotate":
                var rotated = await sender.Send(new RotateSigningKeyCommand(), cancellationToken);
                await output.WriteLineAsync("Rotated the signing key.");
                await output.WriteLineAsync($"Active key: {rotated.ActiveKid}");
                if (rotated.RetiringKid is not null)
                {
                    await output.WriteLineAsync($"Retiring key: {rotated.RetiringKid}, published until {Format(rotated.PublishedUntil!.Value)}");
                }

                await output.WriteLineAsync("A running API starts signing with the new key within a minute.");
                return 0;
            case "list":
                await output.WriteLineAsync("Signing keys:");
                foreach (var key in await sender.Send(new GetSigningKeysQuery(), cancellationToken))
                {
                    var until = key.PublishedUntil is { } published ? $", published until {Format(published)}" : "";
                    await output.WriteLineAsync($"{key.Kid}  {key.State.ToString().ToLowerInvariant(),-8}  created {Format(key.CreatedAt)}{until}");
                }

                return 0;
            default:
                await output.WriteLineAsync(Usage);
                return 1;
        }
    }

    internal static string Format(DateTimeOffset when) =>
        when.UtcDateTime.ToString("yyyy-MM-dd HH:mm 'UTC'", CultureInfo.InvariantCulture);
}
