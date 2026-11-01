using Ingresso.Application.Resources;

namespace Ingresso.Application.Common.Interfaces;

/// <summary>The store of APIs and their scopes, so the Application layer never references OpenIddict (L2-095).</summary>
public interface IResourceRegistry
{
    /// <summary>Every registered API, ordered by name.</summary>
    Task<IReadOnlyList<ResourceDto>> ListAsync(CancellationToken cancellationToken);

    Task RegisterAsync(ResourceDto resource, CancellationToken cancellationToken);

    /// <summary>Removes the API and its scopes; null when no API has this audience.</summary>
    Task<ResourceDto?> RemoveAsync(string audience, CancellationToken cancellationToken);
}
