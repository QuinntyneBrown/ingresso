namespace Ingresso.Infrastructure.Seeding;

/// <summary>
/// The sample relying party (backend/samples/Ingresso.SampleApp), from configuration section <c>SampleApp</c>. When
/// <see cref="BaseUrl"/> is set, as it is for Playwright and demos, <c>seed</c> registers it as a client.
/// </summary>
public sealed class SampleAppOptions
{
    public const string Section = "SampleApp";
    public const string ClientId = "ingresso-sample-app";

    public string? BaseUrl { get; set; }
}
