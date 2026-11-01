using FluentValidation;
using FluentValidation.Results;
using MediatR;
using Ingresso.Application.Common.Exceptions;
using Ingresso.Application.Common.Interfaces;

namespace Ingresso.Application.Clients;

/// <summary>
/// Gives a confidential app a new secret; the old one stops working at once and the new one is returned once (L2-113).
/// </summary>
public sealed record RotateClientSecretCommand(string ClientId) : IRequest<RegisteredClientDto>;

public sealed class RotateClientSecretCommandHandler(IClientRegistry clients) : IRequestHandler<RotateClientSecretCommand, RegisteredClientDto>
{
    public async Task<RegisteredClientDto> Handle(RotateClientSecretCommand request, CancellationToken cancellationToken)
    {
        var app = (await clients.ListAsync(cancellationToken)).SingleOrDefault(c => c.ClientId == request.ClientId)
            ?? throw new NotFoundException($"No app has client ID '{request.ClientId}'.");
        if (!app.Confidential)
        {
            throw new ValidationException([new ValidationFailure(nameof(request.ClientId), $"{app.Name} is a public app, so it has no secret to rotate.")]);
        }

        var secret = RegisterClientCommandHandler.NewSecret();
        return new RegisteredClientDto((await clients.ReplaceSecretAsync(request.ClientId, secret, cancellationToken))!, secret);
    }
}
