using MediatR;
using Ingresso.Application.Common.Interfaces;

namespace Ingresso.Application.Clients;

/// <summary>Every registered app, ordered by name (L2-089).</summary>
public sealed record GetClientsQuery : IRequest<IReadOnlyList<ClientDto>>;

public sealed class GetClientsQueryHandler(IClientRegistry clients) : IRequestHandler<GetClientsQuery, IReadOnlyList<ClientDto>>
{
    public Task<IReadOnlyList<ClientDto>> Handle(GetClientsQuery request, CancellationToken cancellationToken) =>
        clients.ListAsync(cancellationToken);
}
