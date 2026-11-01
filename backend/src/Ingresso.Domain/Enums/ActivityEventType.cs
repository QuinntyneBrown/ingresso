namespace Ingresso.Domain.Enums;

/// <summary>What a security event records (L2-141, L2-143).</summary>
public enum ActivityEventType
{
    SignedIn,
    SignedInToApp,
    AppApproved,
    AppDenied,
    AppAccessRevoked,
    SessionEnded,
    OtherSessionsEnded,
    AppRegistered,
    AppUpdated,
    AppSecretRotated,
    AppDisabled,
    AppEnabled,
    AppDeleted,
    SigningKeyRotated,
}

/// <summary>The filter an event falls under on the Activity page (L2-144).</summary>
public enum ActivityCategory
{
    SignIns,
    AppAccess,
    Sessions,
    AppsAndKeys,
}

public static class ActivityCategories
{
    public static ActivityCategory Of(ActivityEventType type) => type switch
    {
        ActivityEventType.SignedIn or ActivityEventType.SignedInToApp => ActivityCategory.SignIns,
        ActivityEventType.AppApproved or ActivityEventType.AppDenied or ActivityEventType.AppAccessRevoked => ActivityCategory.AppAccess,
        ActivityEventType.SessionEnded or ActivityEventType.OtherSessionsEnded => ActivityCategory.Sessions,
        _ => ActivityCategory.AppsAndKeys,
    };

    /// <summary>The event types in a category.</summary>
    public static IReadOnlyList<ActivityEventType> TypesIn(ActivityCategory category) =>
        Enum.GetValues<ActivityEventType>().Where(t => Of(t) == category).ToList();
}
