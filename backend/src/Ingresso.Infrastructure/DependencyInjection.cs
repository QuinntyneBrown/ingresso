using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Ingresso.Application.Common;
using Ingresso.Application.Common.Interfaces;
using Ingresso.Application.Common.Messages;
using Ingresso.Application.SigningKeys;
using Microsoft.AspNetCore.DataProtection;
using Ingresso.Infrastructure.Email;
using Ingresso.Infrastructure.Identity;
using Ingresso.Infrastructure.Outbox;
using Ingresso.Infrastructure.Persistence;
using Ingresso.Infrastructure.Seeding;
using Ingresso.Infrastructure.Services;

namespace Ingresso.Infrastructure;

public static class DependencyInjection
{
    /// <summary>
    /// Registers persistence and infrastructure services. <c>Database:Provider</c> selects
    /// <c>SqlServer</c> (default) or <c>Sqlite</c> (Playwright and local demos);
    /// <c>ConnectionStrings:Default</c> is the connection string.
    /// </summary>
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Default");
        var provider = configuration["Database:Provider"] ?? "SqlServer";
        services.AddDbContext<AppDbContext>(options =>
        {
            if (string.Equals(provider, "Sqlite", StringComparison.OrdinalIgnoreCase))
            {
                // The migrations are generated against SQL Server (ADR 0010); SQLite applies the same files, so its
                // provider-specific model differences are expected and not a pending change.
                options.UseSqlite(connectionString ?? "Data Source=ingresso.db")
                    .ConfigureWarnings(w => w.Ignore(RelationalEventId.PendingModelChangesWarning));
            }
            else
            {
                options.UseSqlServer(connectionString);
            }
        });

        return services.AddInfrastructureServices(configuration);
    }

    /// <summary>Everything except the DbContext registration, for hosts and tests that register their own.</summary>
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddScoped<IAppDbContext>(sp => sp.GetRequiredService<AppDbContext>());
        var fixedNow = configuration["Clock:FixedUtcNow"];
        services.AddSingleton<IClock>(new SystemClock(string.IsNullOrWhiteSpace(fixedNow) ? null : DateTimeOffset.Parse(fixedNow, System.Globalization.CultureInfo.InvariantCulture)));
        services.AddSingleton<DevMailbox>();
        services.AddSingleton<IEmailSender, DevMailboxEmailSender>();
        services.Configure<OutboxOptions>(configuration.GetSection(OutboxOptions.Section));
        services.AddScoped<IOutbox, Outbox.Outbox>();
        services.AddScoped<OutboxDispatcher>();
        services.AddScoped<IOutboxMessageHandler<SendEmail>, SendEmailHandler>();
        services.Configure<SiteOptions>(configuration.GetSection(SiteOptions.Section));
        services.AddScoped<ISecurityTokenService, SecurityTokenService>();

        // OpenID Connect server stores in AppDbContext (ADR 0014).
        services.AddOpenIddict().AddCore(o => o.UseEntityFrameworkCore().UseDbContext<AppDbContext>());
        services.AddScoped<IClientRegistry, OpenIddictClientRegistry>();
        services.AddScoped<IConsentStore, OpenIddictConsentStore>();
        services.AddScoped<IResourceRegistry, OpenIddictResourceRegistry>();
        // One Data Protection key ring for the API and the CLI, in the database; a certificate protects it in
        // production (ADR 0021).
        var dataProtection = services.AddDataProtection().SetApplicationName("ingresso").PersistKeysToDbContext<AppDbContext>();
        var dataProtectionCertificate = configuration["DataProtection:Certificate:Path"];
        if (!string.IsNullOrWhiteSpace(dataProtectionCertificate))
        {
            var certificate = System.Security.Cryptography.X509Certificates.X509CertificateLoader.LoadPkcs12FromFile(
                dataProtectionCertificate, configuration["DataProtection:Certificate:Password"]);
            dataProtection.ProtectKeysWithCertificate(certificate).UnprotectKeysWithAnyCertificate(certificate);
        }

        // Signing keys in the database, encrypted, rotating (journey 26).
        services.AddSingleton(SigningKeyPolicyFrom(configuration));
        services.AddSingleton<ISigningKeyFactory, DataProtectionSigningKeyFactory>();
        services.AddSingleton<SigningKeyRing>();
        services.AddSingleton<ISignOutTickets, DataProtectionSignOutTickets>();

        services.Configure<SampleAppOptions>(configuration.GetSection(SampleAppOptions.Section));
        services.AddScoped<DatabaseSeeder>();
        services.AddScoped<DatabaseMaintenance>();
        return services;
    }

    /// <summary>
    /// A replaced key stays published for the longest lifetime of a token ingresso signs: the refresh token, the access
    /// token or the identity token (20 minutes, OpenIddict's default) (L2-138).
    /// </summary>
    private static SigningKeyPolicy SigningKeyPolicyFrom(IConfiguration configuration)
    {
        TimeSpan[] lifetimes =
        [
            configuration.GetValue<TimeSpan?>("IdentityProvider:RefreshTokenSlidingLifetime") ?? TimeSpan.FromDays(14),
            configuration.GetValue<TimeSpan?>("IdentityProvider:AccessTokenLifetime") ?? TimeSpan.FromMinutes(10),
            TimeSpan.FromMinutes(20),
        ];
        return new SigningKeyPolicy(lifetimes.Max(), configuration.GetValue<TimeSpan?>("IdentityProvider:SigningKeys:RotationInterval"));
    }
}
