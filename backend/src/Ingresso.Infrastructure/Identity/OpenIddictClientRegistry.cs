using System.Text.Json;
using OpenIddict.Abstractions;
using Ingresso.Application.Clients;
using Ingresso.Application.Common.Interfaces;
using static OpenIddict.Abstractions.OpenIddictConstants;

namespace Ingresso.Infrastructure.Identity;

/// <summary>Stores clients through OpenIddict's application manager (ADR 0014).</summary>
public sealed class OpenIddictClientRegistry(IOpenIddictApplicationManager applications) : IClientRegistry
{
    /// <summary>OpenIddict has no field for it, so the front-channel sign-out address is an application property (L2-099).</summary>
    public const string FrontChannelLogoutUriProperty = "frontchannel_logout_uri";

    /// <summary>OpenIddict has no disabled state either, so it is an application property (L2-114).</summary>
    public const string DisabledProperty = "ingresso_disabled";

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
            ClientId = client.ClientId ?? Guid.NewGuid().ToString("N"),
            DisplayName = client.Name,
            ClientType = client.ClientSecret is null ? ClientTypes.Public : ClientTypes.Confidential,
            // OpenIddict hashes the secret before it stores it (L2-106).
            ClientSecret = client.ClientSecret,
            ConsentType = ConsentTypes.Implicit,
            Requirements = { Requirements.Features.ProofKeyForCodeExchange },
        };
        Apply(descriptor, client);
        await applications.CreateAsync(descriptor, cancellationToken);
        return descriptor.ClientId;
    }

    public async Task<ClientDto?> UpdateAsync(string clientId, NewClient changes, CancellationToken cancellationToken)
    {
        if (await applications.FindByClientIdAsync(clientId, cancellationToken) is not { } app)
        {
            return null;
        }

        var descriptor = new OpenIddictApplicationDescriptor();
        await applications.PopulateAsync(descriptor, app, cancellationToken);
        descriptor.DisplayName = changes.Name;
        descriptor.RedirectUris.Clear();
        descriptor.PostLogoutRedirectUris.Clear();
        descriptor.Permissions.Clear();
        descriptor.Properties.Remove(FrontChannelLogoutUriProperty);
        Apply(descriptor, changes);
        // The stored secret hash is copied back unchanged, so OpenIddict keeps it rather than hashing it again.
        await applications.UpdateAsync(app, descriptor, cancellationToken);
        return await ToDtoAsync(app, cancellationToken);
    }

    public async Task<ClientDto?> ReplaceSecretAsync(string clientId, string secret, CancellationToken cancellationToken)
    {
        if (await applications.FindByClientIdAsync(clientId, cancellationToken) is not { } app)
        {
            return null;
        }

        // This overload hashes the new secret before it replaces the stored one (L2-113).
        await applications.UpdateAsync(app, secret, cancellationToken);
        return await ToDtoAsync(app, cancellationToken);
    }

    public async Task<ClientDto?> SetDisabledAsync(string clientId, bool disabled, CancellationToken cancellationToken)
    {
        if (await applications.FindByClientIdAsync(clientId, cancellationToken) is not { } app)
        {
            return null;
        }

        var descriptor = new OpenIddictApplicationDescriptor();
        await applications.PopulateAsync(descriptor, app, cancellationToken);
        if (disabled)
        {
            descriptor.Properties[DisabledProperty] = JsonSerializer.SerializeToElement(true);
        }
        else
        {
            descriptor.Properties.Remove(DisabledProperty);
        }

        await applications.UpdateAsync(app, descriptor, cancellationToken);
        return await ToDtoAsync(app, cancellationToken);
    }

    public async Task<bool> IsDisabledAsync(string clientId, CancellationToken cancellationToken) =>
        await applications.FindByClientIdAsync(clientId, cancellationToken) is { } app
        && (await applications.GetPropertiesAsync(app, cancellationToken)).ContainsKey(DisabledProperty);

    /// <summary>The standard identity scopes every app may ask for; they aren't listed as the app's API scopes (L2-118).</summary>
    private static readonly string[] IdentityScopePermissions = [Permissions.Scopes.Email, Permissions.Scopes.Profile];

    public async Task<int> AllowIdentityScopesAsync(CancellationToken cancellationToken)
    {
        var changed = 0;
        await foreach (var app in applications.ListAsync(count: null, offset: null, cancellationToken))
        {
            var permissions = await applications.GetPermissionsAsync(app, cancellationToken);
            if (IdentityScopePermissions.All(permissions.Contains))
            {
                continue;
            }

            var descriptor = new OpenIddictApplicationDescriptor();
            await applications.PopulateAsync(descriptor, app, cancellationToken);
            descriptor.Permissions.UnionWith(IdentityScopePermissions);
            await applications.UpdateAsync(app, descriptor, cancellationToken);
            changed++;
        }

        return changed;
    }

    /// <summary>Sets the name, addresses and permissions an app is registered or edited with (L2-087, L2-107, L2-112).</summary>
    private static void Apply(OpenIddictApplicationDescriptor descriptor, NewClient client)
    {
        descriptor.DisplayName = client.Name;
        foreach (var permission in new[]
                 {
                     Permissions.Endpoints.Authorization, Permissions.Endpoints.Token, Permissions.Endpoints.Revocation,
                     Permissions.GrantTypes.AuthorizationCode, Permissions.ResponseTypes.Code, Permissions.Scopes.Email,
                     Permissions.Scopes.Profile,
                 })
        {
            descriptor.Permissions.Add(permission);
        }

        foreach (var address in client.RedirectUris)
        {
            descriptor.RedirectUris.Add(new Uri(address));
        }

        foreach (var address in client.PostLogoutRedirectUris)
        {
            descriptor.PostLogoutRedirectUris.Add(new Uri(address));
        }

        foreach (var scope in client.Scopes ?? [])
        {
            descriptor.Permissions.Add(Permissions.Prefixes.Scope + scope);
        }

        if (client.FrontChannelLogoutUri is { } frontChannel)
        {
            descriptor.Properties[FrontChannelLogoutUriProperty] = JsonSerializer.SerializeToElement(frontChannel);
        }

        // OpenIddict refuses offline_access from an app without the refresh token grant (L2-107).
        if (client.OfflineAccess)
        {
            descriptor.Permissions.Add(Permissions.GrantTypes.RefreshToken);
        }

        if (client.PostLogoutRedirectUris.Count > 0)
        {
            descriptor.Permissions.Add(Permissions.Endpoints.EndSession);
        }
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
        (await applications.GetPostLogoutRedirectUrisAsync(app, cancellationToken)).ToList(),
        (await applications.GetPermissionsAsync(app, cancellationToken))
            .Where(p => p.StartsWith(Permissions.Prefixes.Scope, StringComparison.Ordinal) && !IdentityScopePermissions.Contains(p))
            .Select(p => p[Permissions.Prefixes.Scope.Length..])
            .ToList(),
        (await applications.GetPropertiesAsync(app, cancellationToken)).TryGetValue(FrontChannelLogoutUriProperty, out var frontChannel)
            ? frontChannel.GetString()
            : null,
        await applications.HasClientTypeAsync(app, ClientTypes.Confidential, cancellationToken),
        await applications.HasPermissionAsync(app, Permissions.GrantTypes.RefreshToken, cancellationToken),
        (await applications.GetPropertiesAsync(app, cancellationToken)).ContainsKey(DisabledProperty));
}
