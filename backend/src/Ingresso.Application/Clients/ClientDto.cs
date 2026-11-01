namespace Ingresso.Application.Clients;

/// <summary>A registered app as the CLI shows it.</summary>
public sealed record ClientDto(string ClientId, string Name, IReadOnlyList<string> RedirectUris, IReadOnlyList<string> PostLogoutRedirectUris);

/// <summary>A validated app to register.</summary>
public sealed record NewClient(string Name, IReadOnlyList<string> RedirectUris, IReadOnlyList<string> PostLogoutRedirectUris);
