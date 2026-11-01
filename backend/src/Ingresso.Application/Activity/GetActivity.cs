using MediatR;
using Microsoft.EntityFrameworkCore;
using Ingresso.Application.Common.Interfaces;
using Ingresso.Domain.Enums;

namespace Ingresso.Application.Activity;

/// <summary>
/// An event as the Activity page shows it. <see cref="Type"/> and <see cref="Category"/> are kebab-case, such as
/// <c>signed-in-to-app</c> and <c>sign-ins</c>; <see cref="Actor"/> names the administrator who made an app or key change
/// (L2-142, L2-143).
/// </summary>
public sealed record ActivityEventDto(long Id, string Type, string Category, string Subject, string? Actor, DateTimeOffset OccurredAt);

/// <summary>One page of events, newest first; <see cref="Next"/> asks for the older ones, or is null (L2-144).</summary>
public sealed record ActivityPageDto(IReadOnlyList<ActivityEventDto> Events, long? Next);

/// <summary>The signed-in person's events, and for administrators every app and key change (L2-142 to L2-144).</summary>
public sealed record GetActivityQuery(ActivityCategory? Category = null, long? Before = null) : IRequest<ActivityPageDto>;

public sealed class GetActivityQueryHandler(IAppDbContext db, ICurrentUser user) : IRequestHandler<GetActivityQuery, ActivityPageDto>
{
    public const int PageSize = 20;

    private static readonly ActivityEventType[] Changes = [.. ActivityCategories.TypesIn(ActivityCategory.AppsAndKeys)];

    public async Task<ActivityPageDto> Handle(GetActivityQuery request, CancellationToken cancellationToken)
    {
        var userId = user.UserId ?? throw new UnauthorizedAccessException();
        var administrator = user.Role == UserRole.Admin;
        var events = db.ActivityEvents.Where(e => e.UserId == userId || (administrator && e.UserId == null && Changes.Contains(e.Type)));
        if (request.Category is { } category)
        {
            var types = ActivityCategories.TypesIn(category).ToArray();
            events = events.Where(e => types.Contains(e.Type));
        }

        if (request.Before is { } before)
        {
            events = events.Where(e => e.Id < before);
        }

        var page = await events.OrderByDescending(e => e.Id).Take(PageSize + 1).ToListAsync(cancellationToken);
        var shown = page.Take(PageSize).ToList();
        var actorIds = shown.Where(e => e.ActorId is not null).Select(e => e.ActorId!.Value).Distinct().ToList();
        var actors = await db.Users.Where(u => actorIds.Contains(u.Id)).ToDictionaryAsync(u => u.Id, u => u.Name ?? u.Email, cancellationToken);
        return new ActivityPageDto(
            shown.Select(e => new ActivityEventDto(
                e.Id, Kebab(e.Type.ToString()), Kebab(ActivityCategories.Of(e.Type).ToString()), e.Subject,
                e.ActorId is { } actor && actors.TryGetValue(actor, out var name) ? name : null, e.OccurredAtUtc)).ToList(),
            page.Count > PageSize ? shown[^1].Id : null);
    }

    /// <summary>"SignedInToApp" as "signed-in-to-app"; "SignIns" as "sign-ins".</summary>
    public static string Kebab(string name) =>
        string.Concat(name.Select((c, i) => char.IsUpper(c) && i > 0 ? "-" + char.ToLowerInvariant(c) : char.ToLowerInvariant(c).ToString()));
}
