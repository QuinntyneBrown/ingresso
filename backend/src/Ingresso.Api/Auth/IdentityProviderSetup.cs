using System.Security.Cryptography.X509Certificates;
using Ingresso.Application.Common;
using static OpenIddict.Abstractions.OpenIddictConstants;

namespace Ingresso.Api.Auth;

/// <summary>The OpenID Connect server (ADR 0014): authorization code with PKCE (S256) for registered apps (L2-091 to L2-094).</summary>
public static class IdentityProviderSetup
{
    public static IServiceCollection AddIngressoIdentityProvider(this IServiceCollection services, IConfiguration configuration, IHostEnvironment environment)
    {
        var devOrTest = environment.IsDevelopment() || environment.IsEnvironment("Testing");
        var issuer = (configuration.GetSection(SiteOptions.Section).Get<SiteOptions>() ?? new SiteOptions()).PublicBaseUrl;
        var certificatePath = configuration["IdentityProvider:SigningCertificate:Path"];

        services.AddOpenIddict().AddServer(options =>
        {
            options.SetIssuer(new Uri(issuer.TrimEnd('/') + "/"));
            options.SetAuthorizationEndpointUris("connect/authorize")
                .SetTokenEndpointUris("connect/token")
                .SetJsonWebKeySetEndpointUris(".well-known/jwks");
            options.AllowAuthorizationCodeFlow().RequireProofKeyForCodeExchange();
            options.Configure(o =>
            {
                o.CodeChallengeMethods.Clear();
                o.CodeChallengeMethods.Add(CodeChallengeMethods.Sha256);
            });
            options.RegisterScopes(Scopes.OpenId, Scopes.Email);

            if (!string.IsNullOrWhiteSpace(certificatePath))
            {
                var certificate = X509CertificateLoader.LoadPkcs12FromFile(certificatePath, configuration["IdentityProvider:SigningCertificate:Password"]);
                options.AddSigningCertificate(certificate).AddEncryptionCertificate(certificate);
            }
            else if (devOrTest)
            {
                // Keys change on restart; journey 26 moves them to the database with rotation.
                options.AddEphemeralSigningKey().AddEphemeralEncryptionKey();
            }
            else
            {
                throw new InvalidOperationException("IdentityProvider:SigningCertificate:Path is required outside Development.");
            }

            var aspNetCore = options.UseAspNetCore()
                .EnableAuthorizationEndpointPassthrough()
                .EnableErrorPassthrough();
            if (devOrTest)
            {
                // Development, Playwright and demos run on http://localhost.
                aspNetCore.DisableTransportSecurityRequirement();
            }
        });
        return services;
    }
}
