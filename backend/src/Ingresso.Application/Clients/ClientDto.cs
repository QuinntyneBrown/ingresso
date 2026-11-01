namespace Ingresso.Application.Clients;

/// <summary>
/// A registered app as the CLI and Settings show it, with the API scopes it is allowed (L2-096), its front-channel
/// sign-out address (L2-099) and whether it is confidential, authenticating with a secret (L2-106). Never the secret.
/// </summary>
public sealed record ClientDto(
    string ClientId, string Name, IReadOnlyList<string> RedirectUris, IReadOnlyList<string> PostLogoutRedirectUris, IReadOnlyList<string> Scopes,
    string? FrontChannelLogoutUri = null, bool Confidential = false, bool OfflineAccess = false, bool Disabled = false,
    bool FirstParty = false);

/// <summary>
/// A validated app to register. <paramref name="ClientId"/> is generated unless given (seeded apps use a fixed one);
/// <paramref name="Scopes"/> are the registered API scopes it is allowed. A <paramref name="ClientSecret"/> makes it a
/// confidential client; the registry stores only its hash (L2-106). <paramref name="OfflineAccess"/> lets it ask for
/// refresh tokens (L2-107). A <paramref name="FirstParty"/> app skips the consent page (L2-126).
/// </summary>
public sealed record NewClient(
    string Name, IReadOnlyList<string> RedirectUris, IReadOnlyList<string> PostLogoutRedirectUris, string? ClientId = null,
    IReadOnlyList<string>? Scopes = null, string? FrontChannelLogoutUri = null, string? ClientSecret = null,
    bool OfflineAccess = false, bool FirstParty = false);
