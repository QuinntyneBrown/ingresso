namespace Ingresso.Application.Identity;

/// <summary>
/// "Chrome on macOS" from a browser's user agent: the only thing ingresso keeps about a device, so people can tell
/// their sessions apart without a fingerprint (L2-132, L2-038, ADR 0020).
/// </summary>
public static class DeviceDescription
{
    public const string Unknown = "Unknown device";

    // Order matters: Edge and Opera also say Chrome, Chrome also says Safari, iPhone says "like Mac OS X", Android says Linux.
    private static readonly (string Marker, string Name)[] Browsers =
        [("Edg", "Edge"), ("OPR/", "Opera"), ("Firefox/", "Firefox"), ("FxiOS", "Firefox"), ("CriOS", "Chrome"), ("Chrome/", "Chrome"), ("Safari/", "Safari")];

    private static readonly (string Marker, string Name)[] Systems =
        [("iPhone", "iPhone"), ("iPad", "iPad"), ("Android", "Android"), ("Windows", "Windows"), ("CrOS", "ChromeOS"), ("Mac OS X", "macOS"), ("Macintosh", "macOS"), ("Linux", "Linux")];

    public static string From(string? userAgent)
    {
        if (string.IsNullOrWhiteSpace(userAgent))
        {
            return Unknown;
        }

        var browser = Browsers.FirstOrDefault(b => userAgent.Contains(b.Marker, StringComparison.Ordinal)).Name;
        var system = Systems.FirstOrDefault(s => userAgent.Contains(s.Marker, StringComparison.Ordinal)).Name;
        return (browser, system) switch
        {
            (null, null) => Unknown,
            (null, _) => $"Unknown browser on {system}",
            (_, null) => $"{browser} on an unknown system",
            _ => $"{browser} on {system}",
        };
    }
}
