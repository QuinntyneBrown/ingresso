using Ingresso.Application.Common.Interfaces;
using Ingresso.Domain.Enums;

namespace Ingresso.Application.Common;

/// <summary>
/// The principal outside a web request, such as the CLI: no one. App and key changes made there are recorded with no
/// administrator (L2-143).
/// </summary>
public sealed class NoCurrentUser : ICurrentUser
{
    public Guid? UserId => null;
    public Guid? SessionId => null;
    public UserRole? Role => null;
    public bool IsAuthenticated => false;
}
