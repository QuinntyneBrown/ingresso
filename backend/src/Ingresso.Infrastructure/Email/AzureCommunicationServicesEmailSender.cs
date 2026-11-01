using Azure;
using Azure.Communication.Email;
using Ingresso.Application.Common.Interfaces;
using AcsEmailMessage = Azure.Communication.Email.EmailMessage;
using EmailMessage = Ingresso.Application.Common.Interfaces.EmailMessage;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Ingresso.Infrastructure.Email;

/// <summary>Sends email through Azure Communication Services. Waits for the send to complete so a failure
/// surfaces as an exception and the outbox retries the message.</summary>
public sealed class AzureCommunicationServicesEmailSender : IEmailSender
{
    private readonly EmailClient client;
    private readonly string from;
    private readonly ILogger<AzureCommunicationServicesEmailSender> logger;

    public AzureCommunicationServicesEmailSender(IOptions<EmailOptions> options, ILogger<AzureCommunicationServicesEmailSender> logger)
    {
        var connectionString = options.Value.AzureCommunicationServices.ConnectionString;
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException("Email:AzureCommunicationServices:ConnectionString is required when Email:Provider is AzureCommunicationServices.");
        }

        if (string.IsNullOrWhiteSpace(options.Value.From))
        {
            throw new InvalidOperationException("Email:From is required.");
        }

        client = new EmailClient(connectionString);
        from = options.Value.From;
        this.logger = logger;
    }

    public async Task SendAsync(EmailMessage message, CancellationToken cancellationToken = default)
    {
        var content = new EmailContent(message.Subject) { PlainText = message.TextBody, Html = message.HtmlBody };
        var email = new AcsEmailMessage(from, message.To, content);

        var operation = await client.SendAsync(WaitUntil.Completed, email, cancellationToken);
        var result = operation.Value;
        if (result.Status != EmailSendStatus.Succeeded)
        {
            throw new InvalidOperationException($"Azure Communication Services did not send the email (status {result.Status}, operation {operation.Id}).");
        }

        logger.LogInformation("Sent an email with subject {Subject} (operation {OperationId})", message.Subject, operation.Id);
    }
}
