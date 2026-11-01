namespace Ingresso.Api.Tests.Platform;

/// <summary>A fact for timing tests. Skipped unless <c>INGRESSO_TEST_PERF</c> is set, because wall-clock limits are flaky on shared machines.</summary>
public sealed class PerfFactAttribute : FactAttribute
{
    public const string Variable = "INGRESSO_TEST_PERF";

    public PerfFactAttribute()
    {
        if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable(Variable)))
        {
            Skip = $"Set {Variable}=1 to run performance tests.";
        }
    }
}
