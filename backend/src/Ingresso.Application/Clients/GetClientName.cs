using MediatR;
using Ingresso.Application.Common.Interfaces;

namespace Ingresso.Application.Clients;

/// <summary>A registered app's name, so the sign-in page can say which app the person is signing in to (L2-093).</summary>
public sealed record GetClientNameQuery(string ClientId) : IRequest<string?>;

public sealed class GetClientNameQueryHandler(IClientRegistry clients) : IRequestHandler<GetClientNameQuery, string?>
{
    public Task<string?> Handle(GetClientNameQuery request, CancellationToken cancellationToken) =>
        clients.FindNameAsync(request.ClientId, cancellationToken);
}
