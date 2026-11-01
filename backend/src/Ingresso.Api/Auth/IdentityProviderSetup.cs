using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore;
using OpenIddict.Server;
using OpenIddict.Server.AspNetCore;
using Ingresso.Application.Common;
using static OpenIddict.Abstractions.OpenIddictConstants;

namespace Ingresso.Api.Auth;

/// <summary>The OpenID Connect server (ADR 0014): authorization code with PKCE (S256) for registered apps (L2-091 to L2-094).</summary>
public static class IdentityProviderSetup
{
    /// <summary>Where an end-session request ingresso cannot trust sends the browser (L2-102).</summary>
    public const string SignOutErrorPath = "/authorize-error?flow=sign-out";

    /// <summary>The claim inside code and refresh tokens holding when the chain's sign-in happened (L2-109).</summary>
    public const string ChainStartedClaim = "ingresso_chain_started";

    /// <summary>How long a refresh token lasts after it is issued; each renewal starts it again (L2-109).</summary>
    public static TimeSpan RefreshTokenSlidingLifetime(IConfiguration configuration) =>
        configuration.GetValue<TimeSpan?>("IdentityProvider:RefreshTokenSlidingLifetime") ?? TimeSpan.FromDays(14);

    /// <summary>How long a chain of refresh tokens lasts after its sign-in, however often it renews (L2-109).</summary>
    public static TimeSpan RefreshTokenAbsoluteLifetime(IConfiguration configuration) =>
        configuration.GetValue<TimeSpan?>("IdentityProvider:RefreshTokenAbsoluteLifetime") ?? TimeSpan.FromDays(90);

    private static readonly Lazy<RsaSecurityKey> DevelopmentSigningKey = new(() => new RsaSecurityKey(RSA.Create(2048)));
    private static readonly Lazy<RsaSecurityKey> DevelopmentEncryptionKey = new(() => new RsaSecurityKey(RSA.Create(2048)));

    public static IServiceCollection AddIngressoIdentityProvider(this IServiceCollection services, IConfiguration configuration, IHostEnvironment environment)
    {
        var devOrTest = environment.IsDevelopment() || environment.IsEnvironment("Testing");
        var issuer = (configuration.GetSection(SiteOptions.Section).Get<SiteOptions>() ?? new SiteOptions()).PublicBaseUrl;
        var certificatePath = configuration["IdentityProvider:SigningCertificate:Path"];

        services.AddOpenIddict().AddServer(options =>
        {
            options.SetIssuer(new Uri(issuer.TrimEnd('/') + "/"));
            options.SetEndSessionEndpointUris("connect/endsession");
            options.SetAuthorizationEndpointUris("connect/authorize")
                .SetTokenEndpointUris("connect/token")
                .SetRevocationEndpointUris("connect/revoke")
                .SetUserInfoEndpointUris("connect/userinfo")
                .SetJsonWebKeySetEndpointUris(".well-known/jwks");
            options.AllowAuthorizationCodeFlow().RequireProofKeyForCodeExchange();
            // Apps allowed offline access renew their tokens with rolling refresh tokens (L2-107).
            options.AllowRefreshTokenFlow();
            options.SetRefreshTokenLifetime(RefreshTokenSlidingLifetime(configuration));
            // No grace period: a redeemed refresh token presented again revokes its whole chain at once (L2-108).
            options.SetRefreshTokenReuseLeeway(TimeSpan.Zero);
            options.Configure(o =>
            {
                o.CodeChallengeMethods.Clear();
                o.CodeChallengeMethods.Add(CodeChallengeMethods.Sha256);
            });
            // profile and email are the identity scopes any app may ask for; each carries only its own claims (L2-118).
            options.RegisterScopes(Scopes.OpenId, Scopes.Profile, Scopes.Email, Scopes.OfflineAccess);
            options.RegisterClaims(Claims.Subject, Claims.Name, Claims.Email, Claims.EmailVerified);

            // Access tokens are signed JWTs any app's API can validate with the published keys, and short-lived,
            // because APIs validate them locally without asking ingresso (L2-097).
            options.DisableAccessTokenEncryption();
            options.SetAccessTokenLifetime(
                configuration.GetValue<TimeSpan?>("IdentityProvider:AccessTokenLifetime") ?? TimeSpan.FromMinutes(10));

            if (!string.IsNullOrWhiteSpace(certificatePath))
            {
                var certificate = X509CertificateLoader.LoadPkcs12FromFile(certificatePath, configuration["IdentityProvider:SigningCertificate:Password"]);
                options.AddSigningCertificate(certificate).AddEncryptionCertificate(certificate);
            }
            else if (devOrTest)
            {
                // Keys change on restart; journey 26 moves them to the database with rotation. They are made once per
                // process, so test hosts don't each pay for new RSA keys.
                options.AddSigningKey(DevelopmentSigningKey.Value).AddEncryptionKey(DevelopmentEncryptionKey.Value);
            }
            else
            {
                throw new InvalidOperationException("IdentityProvider:SigningCertificate:Path is required outside Development.");
            }

            // An error that cannot go back to the app (unknown client or redirect address) never redirects to the
            // address it gave: the browser goes to the authorize error page instead (L2-094).
            options.AddEventHandler<OpenIddictServerEvents.ApplyAuthorizationResponseContext>(handler => handler
                .UseInlineHandler(context =>
                {
                    if (context.Error is not null && string.IsNullOrEmpty(context.RedirectUri))
                    {
                        context.Transaction.GetHttpRequest()!.HttpContext.Response.Redirect("/authorize-error");
                        context.HandleRequest();
                    }

                    return default;
                })
                .SetOrder(int.MinValue + 100_000)
                .SetType(OpenIddictServerHandlerType.Custom));

            // A sign-out request OpenIddict rejects (a return address not registered for the app, a bad ID token hint)
            // never redirects and signs no one out (L2-102).
            options.AddEventHandler<OpenIddictServerEvents.ApplyEndSessionResponseContext>(handler => handler
                .UseInlineHandler(context =>
                {
                    if (context.Error is not null)
                    {
                        context.Transaction.GetHttpRequest()!.HttpContext.Response.Redirect(SignOutErrorPath);
                        context.HandleRequest();
                    }

                    return default;
                })
                .SetOrder(int.MinValue + 100_000)
                .SetType(OpenIddictServerHandlerType.Custom));

            var aspNetCore = options.UseAspNetCore()
                .EnableAuthorizationEndpointPassthrough()
                .EnableEndSessionEndpointPassthrough()
                .EnableTokenEndpointPassthrough()
                .EnableUserInfoEndpointPassthrough();
            if (devOrTest)
            {
                // Development, Playwright and demos run on http://localhost.
                aspNetCore.DisableTransportSecurityRequirement();
            }
        });
        return services;
    }
}
