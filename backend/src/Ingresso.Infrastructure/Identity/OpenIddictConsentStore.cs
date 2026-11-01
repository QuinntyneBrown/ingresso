using System.Collections.Immutable;
using OpenIddict.Abstractions;
using Ingresso.Application.Common.Interfaces;
using static OpenIddict.Abstractions.OpenIddictConstants;

namespace Ingresso.Infrastructure.Identity;

/// <summary>Approvals as permanent OpenIddict authorizations; first-party as the implicit consent type (ADR 0018).</summary>
public sealed class OpenIddictConsentStore(
    IOpenIddictApplicationManager applications, IOpenIddictAuthorizationManager authorizations, IOpenIddictScopeManager scopes, IClock clock)
    : IConsentStore
{
    public async Task<ConsentApp?> FindAppAsync(string clientId, CancellationToken cancellationToken)
    {
        if (await applications.FindByClientIdAsync(clientId, cancellationToken) is not { } app)
        {
            return null;
        }

        var permissions = await applications.GetPermissionsAsync(app, cancellationToken);
        var allowed = new List<string> { Scopes.OpenId, Scopes.Profile, Scopes.Email };
        allowed.AddRange(permissions
            .Where(p => p.StartsWith(Permissions.Prefixes.Scope, StringComparison.Ordinal))
            .Select(p => p[Permissions.Prefixes.Scope.Length..])
            .Where(s => !allowed.Contains(s)));
        if (permissions.Contains(Permissions.GrantTypes.RefreshToken))
        {
            allowed.Add(Scopes.OfflineAccess);
        }

        return new ConsentApp(
            (await applications.GetDisplayNameAsync(app, cancellationToken)) ?? clientId,
            await applications.GetConsentTypeAsync(app, cancellationToken) == ConsentTypes.Implicit,
            allowed);
    }

    public async Task<IReadOnlySet<string>> ApprovedScopesAsync(Guid userId, string clientId, CancellationToken cancellationToken)
    {
        var approved = new HashSet<string>(StringComparer.Ordinal);
        if (await ApplicationIdAsync(clientId, cancellationToken) is not { } appId)
        {
            return approved;
        }

        await foreach (var approval in authorizations.FindAsync(userId.ToString(), appId, Statuses.Valid, AuthorizationTypes.Permanent, null, cancellationToken))
        {
            approved.UnionWith(await authorizations.GetScopesAsync(approval, cancellationToken));
        }

        return approved;
    }

    public async Task<string?> FindApprovalAsync(Guid userId, string clientId, IReadOnlyCollection<string> scopes, CancellationToken cancellationToken)
    {
        if (await ApplicationIdAsync(clientId, cancellationToken) is not { } appId)
        {
            return null;
        }

        await foreach (var approval in authorizations.FindAsync(
                           userId.ToString(), appId, Statuses.Valid, AuthorizationTypes.Permanent, scopes.ToImmutableArray(), cancellationToken))
        {
            return await authorizations.GetIdAsync(approval, cancellationToken);
        }

        return null;
    }

    public async Task<string> ApproveAsync(Guid userId, string clientId, IReadOnlyCollection<string> scopes, CancellationToken cancellationToken)
    {
        var appId = await ApplicationIdAsync(clientId, cancellationToken)
            ?? throw new InvalidOperationException($"No app has client ID '{clientId}'.");
        var descriptor = new OpenIddictAuthorizationDescriptor
        {
            ApplicationId = appId,
            Subject = userId.ToString(),
            Status = Statuses.Valid,
            Type = AuthorizationTypes.Permanent,
            CreationDate = clock.UtcNow,
        };
        descriptor.Scopes.UnionWith(scopes);
        var approval = await authorizations.CreateAsync(descriptor, cancellationToken);
        return (await authorizations.GetIdAsync(approval, cancellationToken))!;
    }

    public async Task<IReadOnlyDictionary<string, string>> ApiNamesAsync(IReadOnlyCollection<string> names, CancellationToken cancellationToken)
    {
        var apiNames = new Dictionary<string, string>(StringComparer.Ordinal);
        foreach (var name in names)
        {
            if (await scopes.FindByNameAsync(name, cancellationToken) is { } scope
                && await scopes.GetDisplayNameAsync(scope, cancellationToken) is { } displayName)
            {
                apiNames[name] = displayName;
            }
        }

        return apiNames;
    }

    private async Task<string?> ApplicationIdAsync(string clientId, CancellationToken cancellationToken) =>
        await applications.FindByClientIdAsync(clientId, cancellationToken) is { } app
            ? await applications.GetIdAsync(app, cancellationToken)
            : null;
}
