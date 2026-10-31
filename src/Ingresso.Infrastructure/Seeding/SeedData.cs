namespace Ingresso.Infrastructure.Seeding;

public static class SeedData
{
    public const string UserEmail = "dev@ingresso.dev";
    public const string UserName = "Maya Okafor";

    public sealed record SeedTile(string Name, string Url, string Description, string Color, string Initial, string Category, bool Recent = false);

    public static readonly IReadOnlyList<SeedTile> Tiles =
    [
        new("Gmail", "https://mail.google.com", "Email", "#d93025", "G", "Communication", true),
        new("Slack", "https://slack.com", "Team chat", "#611f69", "S", "Communication", true),
        new("Linear", "https://linear.app", "Issue tracking", "#5e6ad2", "L", "Engineering", true),
        new("GitHub", "https://github.com", "Code hosting", "#24292f", "G", "Engineering"),
        new("Figma", "https://figma.com", "Design", "#a259ff", "F", "Design"),
        new("Notion", "https://notion.so", "Docs and notes", "#000000", "N", "Productivity"),
        new("Salesforce", "https://salesforce.com", "CRM", "#00a1e0", "S", "Business"),
        new("Workday", "https://workday.com", "HR", "#f38b00", "W", "Business"),
        new("Zoom", "https://zoom.us", "Video meetings", "#0b5cff", "Z", "Communication"),
        new("1Password", "https://1password.com", "Passwords", "#0572ec", "1", "Security"),
        new("Datadog", "https://datadoghq.com", "Monitoring", "#632ca6", "D", "Engineering"),
    ];
}
