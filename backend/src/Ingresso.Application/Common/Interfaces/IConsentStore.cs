namespace Ingresso.Application.Common.Interfaces;

/// <summary>
/// An app as consent sees it: its name, whether it is first-party (L2-126), and every scope it may ask for: `openid`,
/// `profile`, `email`, its API scopes and, with refresh tokens, `offline_access`.
/// </summary>
public sealed record ConsentApp(string Name, bool FirstParty, IReadOnlyList<string> AllowedScopes);

/// <summary>People's approvals of what apps may see, kept as permanent OpenIddict authorizations (ADR 0018).</summary>
public interface IConsentStore
{
    Task<ConsentApp?> FindAppAsync(string clientId, CancellationToken cancellationToken);

    /// <summary>Every scope the person has approved for the app, across their approvals.</summary>
    Task<IReadOnlySet<string>> ApprovedScopesAsync(Guid userId, string clientId, CancellationToken cancellationToken);

    /// <summary>The id of an approval that covers all of <paramref name="scopes"/>, if there is one.</summary>
    Task<string?> FindApprovalAsync(Guid userId, string clientId, IReadOnlyCollection<string> scopes, CancellationToken cancellationToken);

    /// <summary>Records an approval of <paramref name="scopes"/>; returns its id.</summary>
    Task<string> ApproveAsync(Guid userId, string clientId, IReadOnlyCollection<string> scopes, CancellationToken cancellationToken);

    /// <summary>The name of the API each scope belongs to, for the scopes that are API scopes.</summary>
    Task<IReadOnlyDictionary<string, string>> ApiNamesAsync(IReadOnlyCollection<string> scopes, CancellationToken cancellationToken);
}
