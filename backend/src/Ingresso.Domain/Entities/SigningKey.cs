using Ingresso.Domain.Enums;

namespace Ingresso.Domain.Entities;

/// <summary>
/// A key ingresso signs tokens with. <see cref="ProtectedKey"/> is the RSA private key, encrypted with Data
/// Protection; the database never holds it in the clear (L2-139).
/// </summary>
public class SigningKey
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>The key id tokens name in their <c>kid</c> header and the JWKS publishes.</summary>
    public string Kid { get; set; } = "";

    public string ProtectedKey { get; set; } = "";
    public DateTimeOffset CreatedAtUtc { get; set; }

    /// <summary>When a newer key replaced it; null while it is the active key.</summary>
    public DateTimeOffset? RetiredAtUtc { get; set; }

    /// <summary>Active until replaced, then retiring for <paramref name="retirementPeriod"/>, then retired (L2-138).</summary>
    public SigningKeyState State(DateTimeOffset now, TimeSpan retirementPeriod) =>
        RetiredAtUtc is null ? SigningKeyState.Active
        : now - RetiredAtUtc.Value < retirementPeriod ? SigningKeyState.Retiring
        : SigningKeyState.Retired;
}
