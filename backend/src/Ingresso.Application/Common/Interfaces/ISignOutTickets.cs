using Ingresso.Application.Identity;

namespace Ingresso.Application.Common.Interfaces;

/// <summary>Protects signed-out tickets, so the signed-out page only ever frames addresses ingresso chose (ADR 0015).</summary>
public interface ISignOutTickets
{
    string Protect(SignOutTicket ticket);

    /// <summary>The ticket, or null when it was not issued by ingresso.</summary>
    SignOutTicket? Read(string protectedTicket);
}
