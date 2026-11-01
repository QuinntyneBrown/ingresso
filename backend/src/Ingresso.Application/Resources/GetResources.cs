using MediatR;
using Ingresso.Application.Common.Interfaces;

namespace Ingresso.Application.Resources;

/// <summary>Every registered API, ordered by name (L2-095).</summary>
public sealed record GetResourcesQuery : IRequest<IReadOnlyList<ResourceDto>>;

public sealed class GetResourcesQueryHandler(IResourceRegistry resources) : IRequestHandler<GetResourcesQuery, IReadOnlyList<ResourceDto>>
{
    public Task<IReadOnlyList<ResourceDto>> Handle(GetResourcesQuery request, CancellationToken cancellationToken) =>
        resources.ListAsync(cancellationToken);
}
