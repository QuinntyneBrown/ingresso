using Ingresso.Domain.Enums;
using MediatR;
using Ingresso.Application.Common.Exceptions;
using Ingresso.Application.Common.Interfaces;

namespace Ingresso.Application.Clients;

/// <summary>Disables an app so it signs no one in and renews no tokens, or enables it again (L2-114).</summary>
public sealed record SetClientDisabledCommand(string ClientId, bool Disabled) : IRequest<ClientDto>;

public sealed class SetClientDisabledCommandHandler(IClientRegistry clients, IAppDbContext db, IActivityLog activity)
    : IRequestHandler<SetClientDisabledCommand, ClientDto>
{
    public async Task<ClientDto> Handle(SetClientDisabledCommand request, CancellationToken cancellationToken)
    {
        var app = await clients.SetDisabledAsync(request.ClientId, request.Disabled, cancellationToken)
            ?? throw new NotFoundException($"No app has client ID '{request.ClientId}'.");
        activity.RecordChange(request.Disabled ? ActivityEventType.AppDisabled : ActivityEventType.AppEnabled, app.Name);
        await db.SaveChangesAsync(cancellationToken);
        return app;
    }
}

/// <summary>Whether an app may sign people in and renew tokens: registered apps are, until disabled (L2-114).</summary>
public sealed record IsClientDisabledQuery(string ClientId) : IRequest<bool>;

public sealed class IsClientDisabledQueryHandler(IClientRegistry clients) : IRequestHandler<IsClientDisabledQuery, bool>
{
    public Task<bool> Handle(IsClientDisabledQuery request, CancellationToken cancellationToken) =>
        clients.IsDisabledAsync(request.ClientId, cancellationToken);
}
