using Ingresso.Application.Clients;

namespace Ingresso.Application.Common.Interfaces;

/// <summary>The OpenID Connect client store (ADR 0014); the Application layer never references OpenIddict.</summary>
public interface IClientRegistry
{
    Task<IReadOnlyList<ClientDto>> ListAsync(CancellationToken cancellationToken);

    /// <summary>Registers a public client that must use PKCE and returns its generated client ID.</summary>
    Task<string> RegisterAsync(NewClient client, CancellationToken cancellationToken);

    /// <summary>Removes the client and returns what it was, or null when no client has this ID.</summary>
    Task<ClientDto?> RemoveAsync(string clientId, CancellationToken cancellationToken);
}
