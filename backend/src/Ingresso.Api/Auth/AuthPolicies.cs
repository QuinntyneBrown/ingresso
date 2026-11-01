namespace Ingresso.Api.Auth;

public static class AuthPolicies
{
    /// <summary>Signed in with a verified email address (L2-029).</summary>
    public const string VerifiedEmail = "verified-email";

    /// <summary>Name of the session cookie (L2-083).</summary>
    public const string SessionCookie = "ingresso.session";
}
