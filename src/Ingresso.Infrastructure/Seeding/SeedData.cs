namespace Ingresso.Infrastructure.Seeding;

public static class SeedData
{
    public const string UserEmail = "dev@ingresso.dev";
    public const string UserName = "Maya Okafor";

    public sealed record SeedTile(string Name, string Url, string Description, string Color, string Initial, string Category, bool Recent = false);

    public static readonly IReadOnlyList<SeedTile> Tiles =
    [
        new("Gmail", "https://mail.google.com", "Email", "#CF3B20", "G", "Communication", true),
        new("Slack", "https://slack.com", "Team chat", "#6D28D9", "S", "Communication", true),
        new("Linear", "https://linear.app", "Issue tracking", "#2563EB", "L", "Engineering", true),
        new("GitHub", "https://github.com", "Code hosting", "#17181C", "G", "Engineering"),
        new("Figma", "https://figma.com", "Design", "#BE185D", "F", "Design"),
        new("Notion", "https://notion.so", "Docs and notes", "#17181C", "N", "Productivity"),
        new("Salesforce", "https://salesforce.com", "CRM", "#2563EB", "S", "Business"),
        new("Workday", "https://workday.com", "HR", "#B26F00", "W", "Business"),
        new("Zoom", "https://zoom.us", "Video meetings", "#2563EB", "Z", "Communication"),
        new("1Password", "https://1password.com", "Passwords", "#0F766E", "1", "Security"),
        new("Datadog", "https://datadoghq.com", "Monitoring", "#6D28D9", "D", "Engineering"),
    ];
}
