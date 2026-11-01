using System.Security.Cryptography;
using Microsoft.AspNetCore.DataProtection;
using Ingresso.Application.Common.Interfaces;
using Ingresso.Domain.Entities;

namespace Ingresso.Infrastructure.Identity;

/// <summary>A 2048-bit RSA key, its PKCS#8 private key protected with Data Protection for storage (L2-139).</summary>
public sealed class DataProtectionSigningKeyFactory(IDataProtectionProvider dataProtection) : ISigningKeyFactory
{
    public const string Purpose = "Ingresso.SigningKeys";

    public SigningKey Create(DateTimeOffset now)
    {
        using var rsa = RSA.Create(2048);
        return new SigningKey
        {
            Kid = RandomNumberGenerator.GetHexString(16, lowercase: true),
            ProtectedKey = dataProtection.CreateProtector(Purpose).Protect(Convert.ToBase64String(rsa.ExportPkcs8PrivateKey())),
            CreatedAtUtc = now,
        };
    }
}
