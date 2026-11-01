using FluentValidation;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using Ingresso.Application.Clients;
using Ingresso.Application.Common.Exceptions;
using static Ingresso.Cli.CliOptions;

namespace Ingresso.Cli;

/// <summary>Registers, lists and removes the apps that sign in with ingresso (L2-087 to L2-089, L2-096, L2-126).</summary>
public static class ClientCommands
{
    public const string Usage =
        "Usage: ingresso clients <add --name <name> --redirect-uri <address> [--redirect-uri <address>] [--post-logout-redirect-uri <address>]"
        + " [--front-channel-logout-uri <address>] [--scope <scope>] [--offline-access] [--first-party] | list | remove --client-id <id>>";

    private const string OfflineAccessFlag = "--offline-access";
    private const string FirstPartyFlag = "--first-party";

    public static async Task<int> RunAsync(string[] args, IServiceProvider services, TextWriter output, CancellationToken cancellationToken)
    {
        // --offline-access (L2-107) and --first-party (L2-126) are the options without a value.
        var rest = args.Skip(1).ToList();
        var offlineAccess = rest.RemoveAll(a => a.Equals(OfflineAccessFlag, StringComparison.OrdinalIgnoreCase)) > 0;
        var firstParty = rest.RemoveAll(a => a.Equals(FirstPartyFlag, StringComparison.OrdinalIgnoreCase)) > 0;
        var flagged = offlineAccess || firstParty;
        var options = Parse(rest.ToArray());
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
                case "add" when Single(options, "--name", out var name) && Only(options, "--name", "--redirect-uri", "--post-logout-redirect-uri", "--front-channel-logout-uri", "--scope")
                                && All(options, "--front-channel-logout-uri").Count <= 1:
                    var (client, _) = await sender.Send(
                        new RegisterClientCommand(
                            name, All(options, "--redirect-uri"), All(options, "--post-logout-redirect-uri"), All(options, "--scope"),
                            All(options, "--front-channel-logout-uri").SingleOrDefault(), OfflineAccess: offlineAccess, FirstParty: firstParty),
                        cancellationToken);
                    await output.WriteLineAsync($"Registered {client.Name}.");
                    await output.WriteLineAsync($"Client ID: {client.ClientId}");
                    return 0;
                case "list" when options.Count == 0 && !flagged:
                    await PrintAsync(await sender.Send(new GetClientsQuery(), cancellationToken), output);
                    return 0;
                case "remove" when Single(options, "--client-id", out var clientId) && options.Count == 1 && !flagged:
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
            if (client.FirstParty)
            {
                await output.WriteLineAsync("  First-party: skips the consent page");
            }

            foreach (var address in client.RedirectUris)
            {
                await output.WriteLineAsync($"  Redirect: {address}");
            }

            foreach (var address in client.PostLogoutRedirectUris)
            {
                await output.WriteLineAsync($"  Sign-out return: {address}");
            }

            if (client.FrontChannelLogoutUri is { } frontChannel)
            {
                await output.WriteLineAsync($"  Front-channel sign-out: {frontChannel}");
            }

            foreach (var scope in client.Scopes)
            {
                await output.WriteLineAsync($"  Scope: {scope}");
            }
        }
    }
}
