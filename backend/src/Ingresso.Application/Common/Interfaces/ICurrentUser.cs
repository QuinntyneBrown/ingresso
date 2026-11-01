using Ingresso.Domain.Enums;

namespace Ingresso.Application.Common.Interfaces;

/// <summary>Application view of the authenticated principal.</summary>
public interface ICurrentUser
{
    Guid? UserId { get; }

    /// <summary>The session this request signed in with (the cookie's <c>sid</c>); null without one.</summary>
    Guid? SessionId { get; }
    UserRole? Role { get; }
    bool IsAuthenticated { get; }
}
