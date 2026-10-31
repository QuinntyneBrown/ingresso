using System.Text.RegularExpressions;
using FluentValidation;
using Ingresso.Domain.Enums;

namespace Ingresso.Application.Tiles;

public static partial class TileRules
{
    [GeneratedRegex("^#[0-9a-fA-F]{6}$")]
    private static partial Regex HexColor();

    [GeneratedRegex(@"^[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?(\.[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?)+(:\d+)?([/?#].*)?$")]
    private static partial Regex BareHost();

    /// <summary>Returns an absolute http(s) URL, turning a bare host such as app.example.com into https; null when invalid.</summary>
    public static string? NormalizeUrl(string? value)
    {
        var text = value?.Trim();
        if (string.IsNullOrEmpty(text) || text.Length > 2048 || text.Any(char.IsWhiteSpace))
        {
            return null;
        }

        if (text.Contains("://", StringComparison.Ordinal))
        {
            return Uri.TryCreate(text, UriKind.Absolute, out var uri) && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps) && !string.IsNullOrEmpty(uri.Host)
                ? uri.ToString()
                : null;
        }

        return BareHost().IsMatch(text) && Uri.TryCreate("https://" + text, UriKind.Absolute, out var bare) ? bare.ToString() : null;
    }

    public static IRuleBuilderOptions<T, string?> MustBeTileUrl<T>(this IRuleBuilder<T, string?> rule) =>
        rule.Must(v => NormalizeUrl(v) is not null).WithMessage("Enter a valid web address, such as app.example.com or https://app.example.com");

    public static IRuleBuilderOptions<T, string?> MustBeHexColor<T>(this IRuleBuilder<T, string?> rule) =>
        rule.Must(v => v is not null && HexColor().IsMatch(v)).WithMessage("Use a hex colour such as #0f6cbd");

    public static string? Clean(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    public static TileSize ParseSize(string? value) =>
        Enum.TryParse<TileSize>(value, ignoreCase: true, out var size) ? size : TileSize.Small;

    public static bool IsSize(string? value) => Enum.TryParse<TileSize>(value, ignoreCase: true, out _) && !int.TryParse(value, out _);

    public static string InitialFor(string? initial, string name) =>
        string.IsNullOrWhiteSpace(initial) ? char.ToUpperInvariant(name.Trim()[0]).ToString() : initial.Trim();
}
