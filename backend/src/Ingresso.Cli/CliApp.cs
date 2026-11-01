using Microsoft.Extensions.DependencyInjection;
using Ingresso.Infrastructure.Persistence;

namespace Ingresso.Cli;

/// <summary>
/// Runs one command: migrate, seed, reset, clients (the apps that sign in with ingresso), resources (the APIs they
/// call with ingresso access tokens), keys (token signing keys) or users (administrators).
/// </summary>
public static class CliApp
{
    public const string Usage = "Usage: ingresso <migrate|seed|reset --confirm|clients ...|resources ...|keys ...|users ...>";

    public static async Task<int> RunAsync(string[] args, IServiceProvider services, TextWriter output, CancellationToken cancellationToken = default)
    {
        var command = args.Length > 0 ? args[0].ToLowerInvariant() : "";
        if (command == "clients")
        {
            return await RunSafelyAsync(command, () => ClientCommands.RunAsync(args[1..], services, output, cancellationToken), output);
        }

        if (command == "resources")
        {
            return await RunSafelyAsync(command, () => ResourceCommands.RunAsync(args[1..], services, output, cancellationToken), output);
        }

        if (command == "keys")
        {
            return await RunSafelyAsync(command, () => KeyCommands.RunAsync(args[1..], services, output, cancellationToken), output);
        }

        if (command == "users")
        {
            return await RunSafelyAsync(command, () => UserCommands.RunAsync(args[1..], services, output, cancellationToken), output);
        }

        var confirmed = args.Length == 2 && args[1] == "--confirm";
        if (args.Length == 0 || (args.Length != 1 && !(command == "reset" && confirmed)))
        {
            await output.WriteLineAsync(Usage);
            return 1;
        }

        if (command == "reset" && !confirmed)
        {
            await output.WriteLineAsync($"reset deletes all data. Run it again with --confirm. {Usage}");
            return 1;
        }

        return await RunSafelyAsync(command, () => ExecuteAsync(command, args[0], services, output, cancellationToken), output);
    }

    private static async Task<int> RunSafelyAsync(string command, Func<Task<int>> run, TextWriter output)
    {
        try
        {
            return await run();
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            await output.WriteLineAsync($"Command '{command}' failed: {ex.Message}");
            return 1;
        }
    }

    private static async Task<int> ExecuteAsync(string command, string raw, IServiceProvider services, TextWriter output, CancellationToken cancellationToken)
    {
        using var scope = services.CreateScope();
        var maintenance = scope.ServiceProvider.GetRequiredService<DatabaseMaintenance>();
        switch (command)
        {
            case "migrate":
                await maintenance.MigrateAsync(cancellationToken);
                await output.WriteLineAsync("Database migrated.");
                return 0;
            case "seed":
                await maintenance.SeedAsync(cancellationToken);
                await output.WriteLineAsync("Database seeded.");
                return 0;
            case "reset":
                await maintenance.ResetAsync(cancellationToken);
                await output.WriteLineAsync("Database reset, migrated and seeded.");
                return 0;
            default:
                await output.WriteLineAsync($"Unknown command '{raw}'. {Usage}");
                return 1;
        }
    }
}
