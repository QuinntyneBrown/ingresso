namespace Ingresso.Application.Resources;

/// <summary>An API the owner publishes: its name, the audience its tokens carry, and the scopes apps may ask for (L2-095).</summary>
public sealed record ResourceDto(string Name, string Audience, IReadOnlyList<string> Scopes);
