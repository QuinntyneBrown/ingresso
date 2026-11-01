using Ingresso.Domain.Enums;

namespace Ingresso.Domain.Entities;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Email { get; set; } = string.Empty;
    public string? Name { get; set; }
    public UserRole Role { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }

    /// <summary>The account a first sign-in creates.</summary>
    public static User CreateMember(string email, DateTimeOffset now) =>
        new() { Email = email, Role = UserRole.Member, CreatedAtUtc = now };

    public string Initials =>
        string.IsNullOrWhiteSpace(Name)
            ? Email[..1].ToUpperInvariant()
            : string.Concat(Name.Split(' ', StringSplitOptions.RemoveEmptyEntries).Take(2).Select(p => char.ToUpperInvariant(p[0])));
}
