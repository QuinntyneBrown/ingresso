using Microsoft.Extensions.Options;
using Microsoft.Extensions.Primitives;
using Microsoft.IdentityModel.Tokens;
using OpenIddict.Server;
using Ingresso.Infrastructure.Identity;

namespace Ingresso.Api.Auth;

/// <summary>Gives OpenIddict the ring's keys to sign with, validate with and publish (L2-137, L2-138).</summary>
public sealed class SigningKeyOptionsSetup(SigningKeyRing ring) : IConfigureOptions<OpenIddictServerOptions>
{
    public void Configure(OpenIddictServerOptions options)
    {
        foreach (var key in ring.Keys)
        {
            options.SigningCredentials.Add(new SigningCredentials(key, SecurityAlgorithms.RsaSha256));
        }
    }
}

/// <summary>Rebuilds OpenIddict's options when the ring's keys change, so a rotation needs no restart (L2-137).</summary>
public sealed class SigningKeyChangeTokenSource(SigningKeyRing ring) : IOptionsChangeTokenSource<OpenIddictServerOptions>
{
    public string Name => Options.DefaultName;

    public IChangeToken GetChangeToken() => ring.GetChangeToken();
}
