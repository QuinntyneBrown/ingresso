namespace Ingresso.Api.Auth;

public static class AuthPolicies
{
    /// <summary>Signed in with a verified email address (L2-029).</summary>
    public const string VerifiedEmail = "verified-email";

    /// <summary>Signed in as an administrator, read from the database on each request (L2-103, ADR 0016).</summary>
    public const string Administrator = "administrator";

    /// <summary>Name of the session cookie (L2-083).</summary>
    public const string SessionCookie = "ingresso.session";
}
