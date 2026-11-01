namespace Ingresso.Application.Common;

/// <summary>Public site settings, from configuration section <c>Site</c>.</summary>
public sealed class SiteOptions
{
    public const string Section = "Site";

    /// <summary>The web app's public origin, used in emails.</summary>
    public string PublicBaseUrl { get; set; } = "https://ingresso.dev";
}
