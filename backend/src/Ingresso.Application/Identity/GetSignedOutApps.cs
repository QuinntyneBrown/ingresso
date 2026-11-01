using MediatR;
using Microsoft.Extensions.Options;
using Ingresso.Application.Common;
using Ingresso.Application.Common.Interfaces;

namespace Ingresso.Application.Identity;

/// <summary>
/// Reads a signed-out ticket for the signed-out page: each app's name and front-channel sign-out address with
/// <c>iss</c> and <c>sid</c>, and the return address. Null for a ticket ingresso did not issue or more than 10 minutes old (L2-101).
/// </summary>
public sealed record GetSignedOutAppsQuery(string Ticket) : IRequest<SignedOutDto?>;

public sealed class GetSignedOutAppsQueryHandler(ISignOutTickets tickets, IClientRegistry clients, IClock clock, IOptions<SiteOptions> site)
    : IRequestHandler<GetSignedOutAppsQuery, SignedOutDto?>
{
    public async Task<SignedOutDto?> Handle(GetSignedOutAppsQuery request, CancellationToken cancellationToken)
    {
        if (tickets.Read(request.Ticket) is not { } ticket || clock.UtcNow - ticket.IssuedAtUtc > SignOutTicket.Lifetime)
        {
            return null;
        }

        // The issuer exactly as ID tokens carry it.
        var issuer = site.Value.PublicBaseUrl.TrimEnd('/') + "/";
        var apps = (await clients.ListAsync(cancellationToken))
            .Where(c => c.FrontChannelLogoutUri is not null && ticket.ClientIds.Contains(c.ClientId))
            .Select(c => new SignedOutAppDto(
                c.Name,
                c.FrontChannelLogoutUri + (c.FrontChannelLogoutUri!.Contains('?') ? '&' : '?')
                    + $"iss={Uri.EscapeDataString(issuer)}&sid={ticket.SessionId}"))
            .ToList();
        return new SignedOutDto(apps, ticket.ReturnUrl);
    }
}
