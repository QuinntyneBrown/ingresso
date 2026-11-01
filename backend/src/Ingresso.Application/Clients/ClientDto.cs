namespace Ingresso.Application.Clients;

/// <summary>A registered app as the CLI shows it.</summary>
public sealed record ClientDto(string ClientId, string Name, IReadOnlyList<string> RedirectUris, IReadOnlyList<string> PostLogoutRedirectUris);

/// <summary>A validated app to register. <paramref name="ClientId"/> is generated unless given (seeded apps use a fixed one).</summary>
public sealed record NewClient(string Name, IReadOnlyList<string> RedirectUris, IReadOnlyList<string> PostLogoutRedirectUris, string? ClientId = null);
