using Ingresso.Application.Clients;

namespace Ingresso.Application.Common.Interfaces;

/// <summary>The OpenID Connect client store (ADR 0014); the Application layer never references OpenIddict.</summary>
public interface IClientRegistry
{
    Task<IReadOnlyList<ClientDto>> ListAsync(CancellationToken cancellationToken);

    /// <summary>The registered app's name, or null when no client has this ID.</summary>
    Task<string?> FindNameAsync(string clientId, CancellationToken cancellationToken);

    /// <summary>Registers a public client that must use PKCE and returns its generated client ID.</summary>
    Task<string> RegisterAsync(NewClient client, CancellationToken cancellationToken);

    /// <summary>
    /// Replaces the app's name, addresses, scopes and offline access with <paramref name="changes"/>, keeping its type
    /// and secret; returns the app, or null when no client has this ID (L2-112).
    /// </summary>
    Task<ClientDto?> UpdateAsync(string clientId, NewClient changes, CancellationToken cancellationToken);

    /// <summary>Replaces a confidential app's secret, which the store hashes; returns the app, or null when no client has this ID (L2-113).</summary>
    Task<ClientDto?> ReplaceSecretAsync(string clientId, string secret, CancellationToken cancellationToken);

    /// <summary>Removes the client and returns what it was, or null when no client has this ID.</summary>
    Task<ClientDto?> RemoveAsync(string clientId, CancellationToken cancellationToken);
}
