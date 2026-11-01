using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;

namespace Ingresso.Api.Tests.Infrastructure;

/// <summary>A self-signed PFX in the temp folder, for test hosts that run outside Development and Testing.</summary>
public static class TestSigningCertificate
{
    private static readonly Lazy<string> File = new(Create);

    public static string Path => File.Value;

    private static string Create()
    {
        using var rsa = RSA.Create(2048);
        var request = new CertificateRequest("CN=ingresso test signing", rsa, HashAlgorithmName.SHA256, RSASignaturePadding.Pkcs1);
        request.CertificateExtensions.Add(new X509KeyUsageExtension(X509KeyUsageFlags.DigitalSignature | X509KeyUsageFlags.KeyEncipherment, critical: true));
        using var certificate = request.CreateSelfSigned(DateTimeOffset.UtcNow.AddDays(-1), DateTimeOffset.UtcNow.AddYears(1));
        var path = System.IO.Path.Combine(System.IO.Path.GetTempPath(), $"ingresso-test-signing-{Guid.NewGuid():N}.pfx");
        System.IO.File.WriteAllBytes(path, certificate.Export(X509ContentType.Pfx));
        return path;
    }
}
