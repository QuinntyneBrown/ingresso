using FluentValidation;
using Ingresso.Domain.Enums;

namespace Ingresso.Application.Tiles;

public static partial class TileRules
{
    /// <summary>The icon colours a tile may use (L2-002); the web app offers the same eight.</summary>
    public static readonly IReadOnlySet<string> Palette = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    {
        "#CF3B20", "#2563EB", "#1B6B3C", "#A15F00", "#6D28D9", "#0F766E", "#BE185D", "#17181C",
    };

    public const int MaxNameLength = 60;
    public const int MaxDescriptionLength = 280;
    public const int MaxAddressLength = 2048;
    public const int MaxTilesPerUser = 200;

    /// <summary>The address as typed, trimmed, when it is an absolute http or https URL of at most 2048 characters; otherwise null (L2-003).</summary>
    public static string? NormalizeUrl(string? value)
    {
        var text = value?.Trim();
        if (string.IsNullOrEmpty(text) || text.Length > MaxAddressLength || text.Any(char.IsWhiteSpace) || !text.Contains("://", StringComparison.Ordinal))
        {
            return null;
        }

        return Uri.TryCreate(text, UriKind.Absolute, out var uri) && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps) && !string.IsNullOrEmpty(uri.Host)
            ? text
            : null;
    }

    public static IRuleBuilderOptions<T, string?> MustBeTileUrl<T>(this IRuleBuilder<T, string?> rule) =>
        rule.Must(v => NormalizeUrl(v) is not null).WithMessage("Enter a full web address that starts with http:// or https://");

    public static IRuleBuilderOptions<T, string?> MustBeInPalette<T>(this IRuleBuilder<T, string?> rule) =>
        rule.Must(v => v is not null && Palette.Contains(v)).WithMessage("Choose one of the colours offered.");

    public static string? Clean(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    public static string InitialFor(string? initial, string name) =>
        string.IsNullOrWhiteSpace(initial) ? char.ToUpperInvariant(name.Trim()[0]).ToString() : initial.Trim();
}
