using MediatR;
using Ingresso.Application.Common.Exceptions;
using Ingresso.Application.Common.Interfaces;

namespace Ingresso.Application.Resources;

/// <summary>Removes the API with this audience and its scopes (L2-095).</summary>
public sealed record RemoveResourceCommand(string Audience) : IRequest<ResourceDto>;

public sealed class RemoveResourceCommandHandler(IResourceRegistry resources) : IRequestHandler<RemoveResourceCommand, ResourceDto>
{
    public async Task<ResourceDto> Handle(RemoveResourceCommand request, CancellationToken cancellationToken) =>
        await resources.RemoveAsync(request.Audience, cancellationToken)
        ?? throw new NotFoundException($"No API has audience '{request.Audience}'.");
}
