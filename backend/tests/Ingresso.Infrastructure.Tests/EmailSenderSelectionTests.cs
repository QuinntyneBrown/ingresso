using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Ingresso.Application.Common.Interfaces;
using Ingresso.Infrastructure.Email;

namespace Ingresso.Infrastructure.Tests;

public sealed class EmailSenderSelectionTests
{
    [Fact]
    public void Dev_mailbox_sends_mail_unless_a_provider_is_named()
    {
        using var services = Build([]);

        Assert.IsType<DevMailboxEmailSender>(services.GetRequiredService<IEmailSender>());
    }

    [Fact]
    public void Azure_communication_services_sends_mail_when_named()
    {
        using var services = Build(new Dictionary<string, string?>
        {
            ["Email:Provider"] = "AzureCommunicationServices",
            ["Email:From"] = "noreply@ingresso.ca",
            ["Email:AzureCommunicationServices:ConnectionString"] = "endpoint=https://example.communication.azure.com/;accesskey=c2VjcmV0",
        });

        Assert.IsType<AzureCommunicationServicesEmailSender>(services.GetRequiredService<IEmailSender>());
    }

    [Fact]
    public void Azure_communication_services_needs_a_connection_string()
    {
        using var services = Build(new Dictionary<string, string?> { ["Email:Provider"] = "AzureCommunicationServices" });

        var error = Assert.Throws<InvalidOperationException>(() => services.GetRequiredService<IEmailSender>());
        Assert.Contains("ConnectionString", error.Message);
    }

    private static ServiceProvider Build(Dictionary<string, string?> settings)
    {
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(settings).Build();
        var services = new ServiceCollection();
        services.AddLogging(b => b.SetMinimumLevel(LogLevel.Warning));
        services.AddInfrastructureServices(configuration);
        return services.BuildServiceProvider();
    }
}
