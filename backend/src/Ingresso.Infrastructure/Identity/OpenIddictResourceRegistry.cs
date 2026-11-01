using OpenIddict.Abstractions;
using Ingresso.Application.Common.Interfaces;
using Ingresso.Application.Resources;

namespace Ingresso.Infrastructure.Identity;

/// <summary>
/// Stores each API scope as an OpenIddict scope entry named after the scope, with the API's name as its display name
/// and the API's audience as its only resource (ADR 0014, L2-095).
/// </summary>
public sealed class OpenIddictResourceRegistry(IOpenIddictScopeManager scopes) : IResourceRegistry
{
    public async Task<IReadOnlyList<ResourceDto>> ListAsync(CancellationToken cancellationToken)
    {
        var entries = new List<(string Audience, string Name, string Scope)>();
        await foreach (var entry in scopes.ListAsync(count: null, offset: null, cancellationToken))
        {
            var audience = (await scopes.GetResourcesAsync(entry, cancellationToken)).FirstOrDefault();
            if (audience is not null)
            {
                entries.Add((audience, await scopes.GetDisplayNameAsync(entry, cancellationToken) ?? audience,
                    (await scopes.GetNameAsync(entry, cancellationToken))!));
            }
        }

        return entries
            .GroupBy(e => e.Audience, StringComparer.Ordinal)
            .Select(g => new ResourceDto(g.First().Name, g.Key, g.Select(e => e.Scope).Order(StringComparer.Ordinal).ToList()))
            .OrderBy(r => r.Name, StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    public async Task RegisterAsync(ResourceDto resource, CancellationToken cancellationToken)
    {
        foreach (var scope in resource.Scopes)
        {
            await scopes.CreateAsync(
                new OpenIddictScopeDescriptor { Name = scope, DisplayName = resource.Name, Resources = { resource.Audience } },
                cancellationToken);
        }
    }

    public async Task<ResourceDto?> RemoveAsync(string audience, CancellationToken cancellationToken)
    {
        var resource = (await ListAsync(cancellationToken)).FirstOrDefault(r => r.Audience == audience);
        if (resource is null)
        {
            return null;
        }

        foreach (var name in resource.Scopes)
        {
            if (await scopes.FindByNameAsync(name, cancellationToken) is { } entry)
            {
                await scopes.DeleteAsync(entry, cancellationToken);
            }
        }

        return resource;
    }
}
