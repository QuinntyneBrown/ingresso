namespace Ingresso.Cli;

/// <summary>Parses the <c>--option value</c> pairs that the clients and resources commands take.</summary>
internal static class CliOptions
{
    /// <summary>Pairs of <c>--option value</c>; null when an option has no value.</summary>
    internal static List<(string Name, string Value)>? Parse(string[] args)
    {
        if (args.Length % 2 != 0)
        {
            return null;
        }

        var options = new List<(string, string)>();
        for (var i = 0; i < args.Length; i += 2)
        {
            if (!args[i].StartsWith("--", StringComparison.Ordinal))
            {
                return null;
            }

            options.Add((args[i].ToLowerInvariant(), args[i + 1]));
        }

        return options;
    }

    internal static bool Single(List<(string Name, string Value)> options, string name, out string value)
    {
        var values = All(options, name);
        value = values.Count == 1 ? values[0] : "";
        return values.Count == 1;
    }

    internal static bool Only(List<(string Name, string Value)> options, params string[] names) => options.All(o => names.Contains(o.Name));

    internal static List<string> All(List<(string Name, string Value)> options, string name) =>
        options.Where(o => o.Name == name).Select(o => o.Value).ToList();
}
