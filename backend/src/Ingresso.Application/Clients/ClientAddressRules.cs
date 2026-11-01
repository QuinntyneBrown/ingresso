namespace Ingresso.Application.Clients;

/// <summary>Redirect and sign-out return addresses are exact, absolute and safe (L2-088).</summary>
public static class ClientAddressRules
{
    /// <summary>The reason the address is refused, or null when it is allowed.</summary>
    public static string? Problem(string? address)
    {
        if (address is null || address.Contains('#') || address.Contains('*'))
        {
            return $"The address '{address}' must not contain '#' or '*'.";
        }

        if (!Uri.TryCreate(address, UriKind.Absolute, out var uri) || (uri.Scheme != Uri.UriSchemeHttps && uri.Scheme != Uri.UriSchemeHttp))
        {
            return $"The address '{address}' must be a full address like https://app.example.com/signin-oidc.";
        }

        if (uri.Scheme == Uri.UriSchemeHttp && !uri.IsLoopback)
        {
            return $"The address '{address}' must use https (http is allowed only for localhost).";
        }

        return null;
    }
}
