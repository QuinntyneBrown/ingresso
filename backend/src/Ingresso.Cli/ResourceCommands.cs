using FluentValidation;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using Ingresso.Application.Common.Exceptions;
using Ingresso.Application.Resources;
using static Ingresso.Cli.CliOptions;

namespace Ingresso.Cli;

/// <summary>Registers, lists and removes the APIs apps call with ingresso access tokens (L2-095).</summary>
public static class ResourceCommands
{
    public const string Usage =
        "Usage: ingresso resources <add --name <name> --audience <audience> --scope <scope> [--scope <scope>] | list | remove --audience <audience>>";

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
                case "add" when Single(options, "--name", out var name) && Single(options, "--audience", out var audience)
                                && Only(options, "--name", "--audience", "--scope"):
                    var added = await sender.Send(new RegisterResourceCommand(name, audience, All(options, "--scope")), cancellationToken);
                    await output.WriteLineAsync($"Registered {added.Name}.");
                    await output.WriteLineAsync($"Audience: {added.Audience}");
                    foreach (var s in added.Scopes)
                    {
                        await output.WriteLineAsync($"Scope: {s}");
                    }

                    return 0;
                case "list" when options.Count == 0:
                    await PrintAsync(await sender.Send(new GetResourcesQuery(), cancellationToken), output);
                    return 0;
                case "remove" when Single(options, "--audience", out var audience) && options.Count == 1:
                    var removed = await sender.Send(new RemoveResourceCommand(audience), cancellationToken);
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

    private static async Task PrintAsync(IReadOnlyList<ResourceDto> resources, TextWriter output)
    {
        if (resources.Count == 0)
        {
            await output.WriteLineAsync("No APIs are registered.");
            return;
        }

        foreach (var resource in resources)
        {
            await output.WriteLineAsync(resource.Name);
            await output.WriteLineAsync($"  Audience: {resource.Audience}");
            foreach (var s in resource.Scopes)
            {
                await output.WriteLineAsync($"  Scope: {s}");
            }
        }
    }
}
