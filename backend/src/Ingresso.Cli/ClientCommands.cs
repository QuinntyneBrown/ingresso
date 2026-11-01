using FluentValidation;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using Ingresso.Application.Clients;
using Ingresso.Application.Common.Exceptions;
using static Ingresso.Cli.CliOptions;

namespace Ingresso.Cli;

/// <summary>Registers, lists and removes the apps that sign in with ingresso (L2-087 to L2-089, L2-096).</summary>
public static class ClientCommands
{
    public const string Usage =
        "Usage: ingresso clients <add --name <name> --redirect-uri <address> [--redirect-uri <address>] [--post-logout-redirect-uri <address>]"
        + " [--scope <scope>] | list | remove --client-id <id>>";

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
                case "add" when Single(options, "--name", out var name) && Only(options, "--name", "--redirect-uri", "--post-logout-redirect-uri", "--scope"):
                    var client = await sender.Send(
                        new RegisterClientCommand(
                            name, All(options, "--redirect-uri"), All(options, "--post-logout-redirect-uri"), All(options, "--scope")),
                        cancellationToken);
                    await output.WriteLineAsync($"Registered {client.Name}.");
                    await output.WriteLineAsync($"Client ID: {client.ClientId}");
                    return 0;
                case "list" when options.Count == 0:
                    await PrintAsync(await sender.Send(new GetClientsQuery(), cancellationToken), output);
                    return 0;
                case "remove" when Single(options, "--client-id", out var clientId) && options.Count == 1:
                    var removed = await sender.Send(new RemoveClientCommand(clientId), cancellationToken);
                    await output.WriteLineAsync($"Removed {removed.Name}.");
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

    private static async Task PrintAsync(IReadOnlyList<ClientDto> clients, TextWriter output)
    {
        if (clients.Count == 0)
        {
            await output.WriteLineAsync("No apps are registered.");
            return;
        }

        foreach (var client in clients)
        {
            await output.WriteLineAsync(client.Name);
            await output.WriteLineAsync($"  Client ID: {client.ClientId}");
            foreach (var address in client.RedirectUris)
            {
                await output.WriteLineAsync($"  Redirect: {address}");
            }

            foreach (var address in client.PostLogoutRedirectUris)
            {
                await output.WriteLineAsync($"  Sign-out return: {address}");
            }

            foreach (var scope in client.Scopes)
            {
                await output.WriteLineAsync($"  Scope: {scope}");
            }
        }
    }
}
