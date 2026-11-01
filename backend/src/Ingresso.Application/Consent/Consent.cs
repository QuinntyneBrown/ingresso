using FluentValidation;
using FluentValidation.Results;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Ingresso.Application.Common.Exceptions;
using Ingresso.Application.Common.Interfaces;
using Ingresso.Domain.Enums;

namespace Ingresso.Application.Consent;

/// <summary>A scope and what it lets the app do, in plain words (L2-122).</summary>
public sealed record ConsentScope(string Scope, string Title);

/// <summary>
/// What the consent page shows: the app, the signed-in email, the scopes to ask for and the scopes already approved.
/// <paramref name="Ask"/> is empty when nothing needs asking (L2-121, L2-125, L2-126).
/// </summary>
public sealed record ConsentDto(string AppName, string Email, IReadOnlyList<ConsentScope> Ask, IReadOnlyList<ConsentScope> Approved);

public sealed record GetConsentQuery(Guid UserId, string ClientId, IReadOnlyList<string> Scopes) : IRequest<ConsentDto>;

/// <summary>Records the person's approval of these scopes for the app (L2-123, L2-127).</summary>
public sealed record ApproveConsentCommand(Guid UserId, string ClientId, IReadOnlyList<string> Scopes) : IRequest;

/// <summary>The approval that covers these scopes, so the tokens can belong to it (L2-123).</summary>
public sealed record FindApprovalQuery(Guid UserId, string ClientId, IReadOnlyList<string> Scopes) : IRequest<string?>;

/// <summary>The plain-language title of each scope (L2-122). `openid` has none: it is the sign-in itself.</summary>
public static class ScopeTitles
{
    public const string OpenId = "openid";

    public static string For(string scope, IReadOnlyDictionary<string, string> apiNames) => scope switch
    {
        "profile" => "See your display name",
        "email" => "See your email address",
        "offline_access" => "Stay signed in when you’re not using it",
        _ when apiNames.TryGetValue(scope, out var api) => $"Use {api} for you",
        _ => scope,
    };
}

/// <summary>Records that the person chose Deny on the consent page (L2-124, L2-141).</summary>
public sealed record RecordConsentDeniedCommand(Guid UserId, string ClientId) : IRequest;

public sealed class ConsentHandlers(IConsentStore store, IAppDbContext db, IActivityLog activity) :
    IRequestHandler<GetConsentQuery, ConsentDto>, IRequestHandler<ApproveConsentCommand>, IRequestHandler<FindApprovalQuery, string?>,
    IRequestHandler<RecordConsentDeniedCommand>
{
    public async Task<ConsentDto> Handle(GetConsentQuery request, CancellationToken cancellationToken)
    {
        var app = await store.FindAppAsync(request.ClientId, cancellationToken)
            ?? throw new NotFoundException($"No app has client ID '{request.ClientId}'.");
        var email = await db.Users.Where(u => u.Id == request.UserId).Select(u => u.Email).SingleOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundException("No such account.");
        var approved = await store.ApprovedScopesAsync(request.UserId, request.ClientId, cancellationToken);
        var requested = request.Scopes.Distinct(StringComparer.Ordinal)
            .Where(s => s != ScopeTitles.OpenId && app.AllowedScopes.Contains(s, StringComparer.Ordinal))
            .ToList();
        var ask = app.FirstParty ? [] : requested.Where(s => !approved.Contains(s)).ToList();
        var shownApproved = approved.Where(s => s != ScopeTitles.OpenId).ToList();
        var apiNames = await store.ApiNamesAsync([.. ask, .. shownApproved], cancellationToken);
        return new ConsentDto(
            app.Name, email, ask.Select(s => new ConsentScope(s, ScopeTitles.For(s, apiNames))).ToList(),
            shownApproved.Select(s => new ConsentScope(s, ScopeTitles.For(s, apiNames))).ToList());
    }

    public async Task Handle(ApproveConsentCommand request, CancellationToken cancellationToken)
    {
        var app = await store.FindAppAsync(request.ClientId, cancellationToken)
            ?? throw new NotFoundException($"No app has client ID '{request.ClientId}'.");
        var scopes = request.Scopes.Distinct(StringComparer.Ordinal).ToList();
        if (scopes.FirstOrDefault(s => !app.AllowedScopes.Contains(s, StringComparer.Ordinal)) is { } refused)
        {
            throw new ValidationException([new ValidationFailure("scope", $"{app.Name} can't ask for '{refused}'.")]);
        }

        // One approval for everything approved so far, so a single authorization covers the next sign-in (L2-125).
        var approved = await store.ApprovedScopesAsync(request.UserId, request.ClientId, cancellationToken);
        await store.ApproveAsync(request.UserId, request.ClientId, [.. approved.Union(scopes, StringComparer.Ordinal)], cancellationToken);
        activity.Record(ActivityEventType.AppApproved, request.UserId, app.Name);
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task Handle(RecordConsentDeniedCommand request, CancellationToken cancellationToken)
    {
        var app = await store.FindAppAsync(request.ClientId, cancellationToken);
        activity.Record(ActivityEventType.AppDenied, request.UserId, app?.Name ?? request.ClientId);
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task<string?> Handle(FindApprovalQuery request, CancellationToken cancellationToken) =>
        await store.FindApprovalAsync(request.UserId, request.ClientId, request.Scopes, cancellationToken);
}
