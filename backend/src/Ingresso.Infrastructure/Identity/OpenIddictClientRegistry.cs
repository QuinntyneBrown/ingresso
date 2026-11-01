using OpenIddict.Abstractions;
using Ingresso.Application.Clients;
using Ingresso.Application.Common.Interfaces;
using static OpenIddict.Abstractions.OpenIddictConstants;

namespace Ingresso.Infrastructure.Identity;

/// <summary>Stores clients through OpenIddict's application manager (ADR 0014).</summary>
public sealed class OpenIddictClientRegistry(IOpenIddictApplicationManager applications) : IClientRegistry
{
    public async Task<IReadOnlyList<ClientDto>> ListAsync(CancellationToken cancellationToken)
    {
        var clients = new List<ClientDto>();
        await foreach (var app in applications.ListAsync(count: null, offset: null, cancellationToken))
        {
            clients.Add(await ToDtoAsync(app, cancellationToken));
        }

        return clients.OrderBy(c => c.Name, StringComparer.OrdinalIgnoreCase).ToList();
    }

    public async Task<string?> FindNameAsync(string clientId, CancellationToken cancellationToken) =>
        await applications.FindByClientIdAsync(clientId, cancellationToken) is { } app
            ? await applications.GetDisplayNameAsync(app, cancellationToken)
            : null;

    public async Task<string> RegisterAsync(NewClient client, CancellationToken cancellationToken)
    {
        var descriptor = new OpenIddictApplicationDescriptor
        {
            ClientId = Guid.NewGuid().ToString("N"),
            DisplayName = client.Name,
            ClientType = ClientTypes.Public,
            ConsentType = ConsentTypes.Implicit,
            Permissions =
            {
                Permissions.Endpoints.Authorization,
                Permissions.Endpoints.Token,
                Permissions.GrantTypes.AuthorizationCode,
                Permissions.ResponseTypes.Code,
                Permissions.Scopes.Email,
            },
            Requirements = { Requirements.Features.ProofKeyForCodeExchange },
        };
        foreach (var address in client.RedirectUris)
        {
            descriptor.RedirectUris.Add(new Uri(address));
        }

        foreach (var address in client.PostLogoutRedirectUris)
        {
            descriptor.PostLogoutRedirectUris.Add(new Uri(address));
        }

        if (client.PostLogoutRedirectUris.Count > 0)
        {
            descriptor.Permissions.Add(Permissions.Endpoints.EndSession);
        }

        await applications.CreateAsync(descriptor, cancellationToken);
        return descriptor.ClientId;
    }

    public async Task<ClientDto?> RemoveAsync(string clientId, CancellationToken cancellationToken)
    {
        if (await applications.FindByClientIdAsync(clientId, cancellationToken) is not { } app)
        {
            return null;
        }

        var removed = await ToDtoAsync(app, cancellationToken);
        await applications.DeleteAsync(app, cancellationToken);
        return removed;
    }

    private async Task<ClientDto> ToDtoAsync(object app, CancellationToken cancellationToken) => new(
        (await applications.GetClientIdAsync(app, cancellationToken))!,
        (await applications.GetDisplayNameAsync(app, cancellationToken)) ?? "",
        (await applications.GetRedirectUrisAsync(app, cancellationToken)).ToList(),
        (await applications.GetPostLogoutRedirectUrisAsync(app, cancellationToken)).ToList());
}
