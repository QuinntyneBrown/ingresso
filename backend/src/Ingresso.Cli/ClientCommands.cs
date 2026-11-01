using FluentValidation;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using Ingresso.Application.Clients;
using Ingresso.Application.Common.Exceptions;

namespace Ingresso.Cli;

/// <summary>Registers, lists and removes the apps that sign in with ingresso (L2-087 to L2-089).</summary>
public static class ClientCommands
{
    public const string Usage =
        "Usage: ingresso clients add --name <name> --redirect-uri <address> [--redirect-uri <address>] [--post-logout-redirect-uri <address>]";

    public static async Task<int> RunAsync(string[] args, IServiceProvider services, TextWriter output, CancellationToken cancellationToken)
    {
        var options = Parse(args.Skip(1).ToArray());
        if (args.Length == 0 || options is null)
        {
            await output.WriteLineAsync(Usage);
            return 1;
        }

        using var scope = services.CreateScope();
        var sender = scope.ServiceProvider.GetRequiredService<ISender>();
        try
        {
            switch (args[0].ToLowerInvariant())
            {
                case "add" when Single(options, "--name", out var name) && Only(options, "--name", "--redirect-uri", "--post-logout-redirect-uri"):
                    var client = await sender.Send(
                        new RegisterClientCommand(name, All(options, "--redirect-uri"), All(options, "--post-logout-redirect-uri")),
                        cancellationToken);
                    await output.WriteLineAsync($"Registered {client.Name}.");
                    await output.WriteLineAsync($"Client ID: {client.ClientId}");
                    return 0;
                default:
                    await output.WriteLineAsync(Usage);
                    return 1;
            }
        }
        catch (ValidationException ex)
        {
            foreach (var message in ex.Errors.Select(e => e.ErrorMessage).Distinct())
            {
                await output.WriteLineAsync(message);
            }

            return 1;
        }
        catch (Exception ex) when (ex is ConflictException or NotFoundException)
        {
            await output.WriteLineAsync(ex.Message);
            return 1;
        }
    }

    /// <summary>Pairs of <c>--option value</c>; null when an option has no value.</summary>
    private static List<(string Name, string Value)>? Parse(string[] args)
    {
        if (args.Length % 2 != 0)
        {
            return null;
        }

        var options = new List<(string, string)>();
        for (var i = 0; i < args.Length; i += 2)
        {
            if (!args[i].StartsWith("--", StringComparison.Ordinal))
            {
                return null;
            }

            options.Add((args[i].ToLowerInvariant(), args[i + 1]));
        }

        return options;
    }

    private static bool Single(List<(string Name, string Value)> options, string name, out string value)
    {
        var values = All(options, name);
        value = values.Count == 1 ? values[0] : "";
        return values.Count == 1;
    }

    private static bool Only(List<(string Name, string Value)> options, params string[] names) => options.All(o => names.Contains(o.Name));

    private static List<string> All(List<(string Name, string Value)> options, string name) =>
        options.Where(o => o.Name == name).Select(o => o.Value).ToList();
}
