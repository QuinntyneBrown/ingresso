namespace Ingresso.Application.Clients;

/// <summary>
/// A registered app as the CLI shows it, with the API scopes it is allowed (L2-096) and its front-channel sign-out
/// address (L2-099).
/// </summary>
public sealed record ClientDto(
    string ClientId, string Name, IReadOnlyList<string> RedirectUris, IReadOnlyList<string> PostLogoutRedirectUris, IReadOnlyList<string> Scopes,
    string? FrontChannelLogoutUri = null);

/// <summary>
/// A validated app to register. <paramref name="ClientId"/> is generated unless given (seeded apps use a fixed one);
/// <paramref name="Scopes"/> are the registered API scopes it is allowed.
/// </summary>
public sealed record NewClient(
    string Name, IReadOnlyList<string> RedirectUris, IReadOnlyList<string> PostLogoutRedirectUris, string? ClientId = null,
    IReadOnlyList<string>? Scopes = null, string? FrontChannelLogoutUri = null);
