using Ingresso.Domain.Enums;
using MediatR;
using Ingresso.Application.Common.Exceptions;
using Ingresso.Application.Common.Interfaces;

namespace Ingresso.Application.Clients;

/// <summary>
/// Changes an app's name, addresses, scopes, offline access and first-party option with the registration rules
/// (L2-112, L2-126). Its client type
/// and secret never change here.
/// </summary>
public sealed record UpdateClientCommand(
    string ClientId, string? Name, IReadOnlyList<string>? RedirectUris, IReadOnlyList<string>? PostLogoutRedirectUris,
    IReadOnlyList<string>? Scopes = null, string? FrontChannelLogoutUri = null, bool OfflineAccess = false, bool FirstParty = false)
    : IRequest<ClientDto>, IClientFields;

public sealed class UpdateClientCommandValidator : ClientFieldsValidator<UpdateClientCommand>;

public sealed class UpdateClientCommandHandler(IClientRegistry clients, IResourceRegistry resources, IAppDbContext db, IActivityLog activity)
    : IRequestHandler<UpdateClientCommand, ClientDto>
{
    public async Task<ClientDto> Handle(UpdateClientCommand request, CancellationToken cancellationToken)
    {
        var existing = await clients.ListAsync(cancellationToken);
        if (existing.All(c => c.ClientId != request.ClientId))
        {
            throw new NotFoundException($"No app has client ID '{request.ClientId}'.");
        }

        var name = request.Name!.Trim();
        if (existing.Any(c => c.ClientId != request.ClientId && string.Equals(c.Name, name, StringComparison.OrdinalIgnoreCase)))
        {
            throw new ConflictException($"An app named '{name}' is already registered.");
        }

        var scopes = RegisterClientCommandHandler.Distinct(request.Scopes ?? []);
        var known = (await resources.ListAsync(cancellationToken)).SelectMany(r => r.Scopes).ToHashSet(StringComparer.Ordinal);
        if (scopes.FirstOrDefault(s => !known.Contains(s)) is { } unknown)
        {
            throw new NotFoundException($"No API has scope '{unknown}'.");
        }

        var changes = new NewClient(
            name, RegisterClientCommandHandler.Distinct(request.RedirectUris!), RegisterClientCommandHandler.Distinct(request.PostLogoutRedirectUris ?? []),
            Scopes: scopes, FrontChannelLogoutUri: request.FrontChannelLogoutUri?.Trim(), OfflineAccess: request.OfflineAccess,
            FirstParty: request.FirstParty);
        var updated = (await clients.UpdateAsync(request.ClientId, changes, cancellationToken))!;
        activity.RecordChange(ActivityEventType.AppUpdated, updated.Name);
        await db.SaveChangesAsync(cancellationToken);
        return updated;
    }
}
