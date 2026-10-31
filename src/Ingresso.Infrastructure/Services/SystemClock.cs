using Ingresso.Application.Common.Interfaces;

namespace Ingresso.Infrastructure.Services;

/// <summary>Real time, or a fixed instant when <c>Clock:FixedUtcNow</c> is set (tests, Playwright, demos).</summary>
public sealed class SystemClock(DateTimeOffset? fixedUtcNow = null) : IClock
{
    public DateTimeOffset UtcNow => fixedUtcNow ?? DateTimeOffset.UtcNow;
}
