namespace Ingresso.Application.SigningKeys;

/// <summary>
/// How long a replaced key stays published (the longest lifetime of a token ingresso signs), and how often keys
/// rotate on their own (null: never, the default) (L2-138, L2-140).
/// </summary>
public sealed record SigningKeyPolicy(TimeSpan RetirementPeriod, TimeSpan? RotationInterval);
