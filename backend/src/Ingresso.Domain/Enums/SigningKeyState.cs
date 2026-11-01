namespace Ingresso.Domain.Enums;

/// <summary>Where a signing key is in its life (L2-136, L2-138).</summary>
public enum SigningKeyState
{
    /// <summary>New tokens are signed with it.</summary>
    Active,

    /// <summary>Replaced, but still published and accepted until its tokens have expired.</summary>
    Retiring,

    /// <summary>No longer published or accepted.</summary>
    Retired,
}
