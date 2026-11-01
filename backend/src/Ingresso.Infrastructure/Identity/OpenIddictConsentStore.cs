using System.Collections.Immutable;
using OpenIddict.Abstractions;
using Ingresso.Application.Common.Interfaces;
using static OpenIddict.Abstractions.OpenIddictConstants;

namespace Ingresso.Infrastructure.Identity;

/// <summary>Approvals as permanent OpenIddict authorizations; first-party as the implicit consent type (ADR 0018).</summary>
public sealed class OpenIddictConsentStore(
    IOpenIddictApplicationManager applications, IOpenIddictAuthorizationManager authorizations, IOpenIddictScopeManager scopes,
    IOpenIddictTokenManager tokens)
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
            // OpenIddict's own clock and whole seconds, as it dates tokens, so "approved" and "last used" compare (ADR 0019).
            CreationDate = WholeSeconds(TimeProvider.System.GetUtcNow()),
        };
        descriptor.Scopes.UnionWith(scopes);
        var approval = await authorizations.CreateAsync(descriptor, cancellationToken);
        return (await authorizations.GetIdAsync(approval, cancellationToken))!;
    }

    public async Task<IReadOnlyList<ConnectedApp>> ListConnectedAsync(Guid userId, CancellationToken cancellationToken)
    {
        // The person's authorizations, by app: approvals make an app connected; every authorization's tokens count as use.
        var byApp = new Dictionary<string, List<object>>(StringComparer.Ordinal);
        await foreach (var authorization in authorizations.FindBySubjectAsync(userId.ToString(), cancellationToken))
        {
            if (await authorizations.GetApplicationIdAsync(authorization, cancellationToken) is { } appId)
            {
                (byApp.TryGetValue(appId, out var list) ? list : byApp[appId] = []).Add(authorization);
            }
        }

        var connected = new List<ConnectedApp>();
        foreach (var (appId, owned) in byApp)
        {
            var approvals = new List<object>();
            foreach (var authorization in owned)
            {
                if (await authorizations.HasStatusAsync(authorization, Statuses.Valid, cancellationToken)
                    && await authorizations.HasTypeAsync(authorization, AuthorizationTypes.Permanent, cancellationToken))
                {
                    approvals.Add(authorization);
                }
            }

            if (approvals.Count == 0 || await applications.FindByIdAsync(appId, cancellationToken) is not { } app)
            {
                continue;
            }

            var approvedScopes = new HashSet<string>(StringComparer.Ordinal);
            var approvedAt = DateTimeOffset.MaxValue;
            foreach (var approval in approvals)
            {
                approvedScopes.UnionWith(await authorizations.GetScopesAsync(approval, cancellationToken));
                approvedAt = Min(approvedAt, await authorizations.GetCreationDateAsync(approval, cancellationToken) ?? approvedAt);
            }

            DateTimeOffset? lastUsed = null;
            foreach (var authorization in owned)
            {
                await foreach (var token in tokens.FindByAuthorizationIdAsync((await authorizations.GetIdAsync(authorization, cancellationToken))!, cancellationToken))
                {
                    if (await tokens.GetCreationDateAsync(token, cancellationToken) is { } created && (lastUsed is null || created > lastUsed))
                    {
                        lastUsed = created;
                    }
                }
            }

            connected.Add(new ConnectedApp(
                (await applications.GetClientIdAsync(app, cancellationToken))!,
                (await applications.GetDisplayNameAsync(app, cancellationToken)) ?? "",
                [.. approvedScopes], approvedAt, lastUsed));
        }

        return connected;
    }

    public async Task<bool> RevokeAsync(Guid userId, string clientId, CancellationToken cancellationToken)
    {
        if (await applications.FindByClientIdAsync(clientId, cancellationToken) is not { } app
            || await applications.GetIdAsync(app, cancellationToken) is not { } appId)
        {
            return false;
        }

        var connected = false;
        await foreach (var authorization in authorizations.FindAsync(userId.ToString(), appId, status: null, type: null, scopes: null, cancellationToken))
        {
            connected |= await authorizations.HasStatusAsync(authorization, Statuses.Valid, cancellationToken)
                && await authorizations.HasTypeAsync(authorization, AuthorizationTypes.Permanent, cancellationToken);
            await authorizations.TryRevokeAsync(authorization, cancellationToken);
            await tokens.RevokeByAuthorizationIdAsync((await authorizations.GetIdAsync(authorization, cancellationToken))!, cancellationToken);
        }

        return connected;
    }

    private static DateTimeOffset WholeSeconds(DateTimeOffset value) => value.AddTicks(-(value.Ticks % TimeSpan.TicksPerSecond));

    private static DateTimeOffset Min(DateTimeOffset a, DateTimeOffset b) => a < b ? a : b;

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
