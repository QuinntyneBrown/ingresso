using MediatR;
using Ingresso.Application.Common.Exceptions;
using Ingresso.Application.Common.Interfaces;

namespace Ingresso.Application.Clients;

/// <summary>Removes the app with this client ID (L2-089).</summary>
public sealed record RemoveClientCommand(string ClientId) : IRequest<ClientDto>;

public sealed class RemoveClientCommandHandler(IClientRegistry clients) : IRequestHandler<RemoveClientCommand, ClientDto>
{
    public async Task<ClientDto> Handle(RemoveClientCommand request, CancellationToken cancellationToken) =>
        await clients.RemoveAsync(request.ClientId, cancellationToken)
        ?? throw new NotFoundException($"No app has client ID '{request.ClientId}'.");
}
