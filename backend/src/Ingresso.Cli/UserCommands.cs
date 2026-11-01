using MediatR;
using Microsoft.Extensions.DependencyInjection;
using Ingresso.Application.Common.Exceptions;
using Ingresso.Application.Identity;
using static Ingresso.Cli.CliOptions;

namespace Ingresso.Cli;

/// <summary>Makes an account an administrator, who can register apps in Settings (L2-103, ADR 0016).</summary>
public static class UserCommands
{
    public const string Usage = "Usage: ingresso users grant-admin --email <email>";

    public static async Task<int> RunAsync(string[] args, IServiceProvider services, TextWriter output, CancellationToken cancellationToken)
    {
        var options = Parse(args.Skip(1).ToArray());
        if (args.Length == 0 || options is null
            || args[0].ToLowerInvariant() != "grant-admin" || !Single(options, "--email", out var email) || options.Count != 1)
        {
            await output.WriteLineAsync(Usage);
            return 1;
        }

        using var scope = services.CreateScope();
        try
        {
            var granted = await scope.ServiceProvider.GetRequiredService<ISender>().Send(new GrantAdministratorCommand(email), cancellationToken);
            var normalized = email.Trim().ToLowerInvariant();
            await output.WriteLineAsync(granted ? $"{normalized} is now an administrator." : $"{normalized} is already an administrator.");
            return 0;
        }
        catch (NotFoundException ex)
        {
            await output.WriteLineAsync(ex.Message);
            return 1;
        }
    }
}
