using MediatR;
using Microsoft.EntityFrameworkCore;
using Ingresso.Application.Common.Exceptions;
using Ingresso.Application.Common.Interfaces;

namespace Ingresso.Application.Identity;

/// <summary>One of the person's signed-in devices, as Settings → Devices shows it (L2-132).</summary>
public sealed record DeviceDto(Guid Id, string Device, DateTimeOffset SignedInAt, DateTimeOffset LastActiveAt, bool Current);

/// <summary>The signed-in person's active sessions, most recently active first; never anyone else's (L2-132, L2-032).</summary>
public sealed record GetDevicesQuery : IRequest<IReadOnlyList<DeviceDto>>;

/// <summary>
/// Ends one of the person's other active sessions, signing that device out; anything else is 404 (L2-133). Apps
/// signed in under it can't renew, because a refresh needs its session (L2-135).
/// </summary>
public sealed record EndSessionCommand(Guid SessionId) : IRequest;

public sealed class DevicesHandlers(IAppDbContext db, ICurrentUser currentUser, IClock clock) :
    IRequestHandler<GetDevicesQuery, IReadOnlyList<DeviceDto>>,
    IRequestHandler<EndSessionCommand>
{
    public async Task Handle(EndSessionCommand request, CancellationToken cancellationToken)
    {
        var now = clock.UtcNow;
        var session = await db.Sessions.SingleOrDefaultAsync(
            s => s.Id == request.SessionId && s.UserId == currentUser.UserId && s.RevokedAtUtc == null, cancellationToken);
        if (session is null || session.Id == currentUser.SessionId || !session.IsActive(now))
        {
            throw new NotFoundException($"No other session '{request.SessionId}'.");
        }

        session.RevokedAtUtc = now;
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<DeviceDto>> Handle(GetDevicesQuery request, CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId!.Value;
        var now = clock.UtcNow;
        var sessions = await db.Sessions.Where(s => s.UserId == userId && s.RevokedAtUtc == null).ToListAsync(cancellationToken);
        return sessions
            .Where(s => s.IsActive(now))
            .OrderByDescending(s => s.Id == currentUser.SessionId)
            .ThenByDescending(s => s.LastSeenAtUtc)
            .Select(s => new DeviceDto(
                s.Id, s.Device.Length == 0 ? DeviceDescription.Unknown : s.Device, s.CreatedAtUtc, s.LastSeenAtUtc, s.Id == currentUser.SessionId))
            .ToList();
    }
}
