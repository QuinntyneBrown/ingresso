using System.Text.Json;
using Microsoft.AspNetCore.DataProtection;
using Ingresso.Application.Common.Interfaces;
using Ingresso.Application.Identity;

namespace Ingresso.Infrastructure.Identity;

/// <summary>Signed-out tickets as ASP.NET Core Data Protection payloads (ADR 0015).</summary>
public sealed class DataProtectionSignOutTickets(IDataProtectionProvider provider) : ISignOutTickets
{
    private readonly IDataProtector protector = provider.CreateProtector("Ingresso.SignOutTicket.v1");

    public string Protect(SignOutTicket ticket) => protector.Protect(JsonSerializer.Serialize(ticket));

    public SignOutTicket? Read(string protectedTicket)
    {
        try
        {
            return JsonSerializer.Deserialize<SignOutTicket>(protector.Unprotect(protectedTicket));
        }
        catch (Exception ex) when (ex is System.Security.Cryptography.CryptographicException or JsonException or FormatException)
        {
            return null;
        }
    }
}
