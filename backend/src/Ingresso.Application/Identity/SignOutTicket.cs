namespace Ingresso.Application.Identity;

/// <summary>
/// What the signed-out page needs after the session has ended: the session, the apps to notify and, when an app
/// started the sign-out, where to continue (L2-100, L2-101). Issued at <see cref="IssuedAtUtc"/>, readable for 10 minutes.
/// </summary>
public sealed record SignOutTicket(Guid SessionId, IReadOnlyList<string> ClientIds, string? ReturnUrl, DateTimeOffset IssuedAtUtc)
{
    public static readonly TimeSpan Lifetime = TimeSpan.FromMinutes(10);
}

/// <summary>An app the signed-out page notifies: its name and its front-channel sign-out address with iss and sid.</summary>
public sealed record SignedOutAppDto(string Name, string LogoutUri);

/// <summary>The apps the signed-out page notifies, and where it continues afterwards (null: show Sign in again).</summary>
public sealed record SignedOutDto(IReadOnlyList<SignedOutAppDto> Apps, string? ReturnUrl);
