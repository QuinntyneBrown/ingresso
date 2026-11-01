using MediatR;
using Microsoft.EntityFrameworkCore;
using Ingresso.Application.Common.Interfaces;

namespace Ingresso.Application.Identity;

/// <summary>One of the person's signed-in devices, as Settings → Devices shows it (L2-132).</summary>
public sealed record DeviceDto(Guid Id, string Device, DateTimeOffset SignedInAt, DateTimeOffset LastActiveAt, bool Current);

/// <summary>The signed-in person's active sessions, most recently active first; never anyone else's (L2-132, L2-032).</summary>
public sealed record GetDevicesQuery : IRequest<IReadOnlyList<DeviceDto>>;

public sealed class DevicesHandlers(IAppDbContext db, ICurrentUser currentUser, IClock clock) :
    IRequestHandler<GetDevicesQuery, IReadOnlyList<DeviceDto>>
{
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
