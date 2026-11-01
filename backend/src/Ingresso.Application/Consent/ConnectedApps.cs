using MediatR;
using Ingresso.Application.Common.Interfaces;

namespace Ingresso.Application.Consent;

/// <summary>A connected app as Settings shows it: what it can do in plain words, and when (L2-128).</summary>
public sealed record ConnectedAppDto(
    string ClientId, string Name, IReadOnlyList<ConsentScope> Scopes, DateTimeOffset ApprovedAt, DateTimeOffset? LastUsedAt);

/// <summary>The signed-in person's connected apps, sorted by name; never anyone else's (L2-128, L2-032).</summary>
public sealed record GetConnectedAppsQuery : IRequest<IReadOnlyList<ConnectedAppDto>>;

public sealed class ConnectedAppsHandlers(IConsentStore store, ICurrentUser currentUser) :
    IRequestHandler<GetConnectedAppsQuery, IReadOnlyList<ConnectedAppDto>>
{
    public async Task<IReadOnlyList<ConnectedAppDto>> Handle(GetConnectedAppsQuery request, CancellationToken cancellationToken)
    {
        var apps = await store.ListConnectedAsync(currentUser.UserId!.Value, cancellationToken);
        var apiNames = await store.ApiNamesAsync([.. apps.SelectMany(a => a.Scopes).Distinct(StringComparer.Ordinal)], cancellationToken);
        return apps
            .OrderBy(a => a.Name, StringComparer.OrdinalIgnoreCase)
            .Select(a => new ConnectedAppDto(
                a.ClientId, a.Name,
                a.Scopes.Where(s => s != ScopeTitles.OpenId).Select(s => new ConsentScope(s, ScopeTitles.For(s, apiNames))).ToList(),
                a.ApprovedAt, a.LastUsedAt))
            .ToList();
    }
}
