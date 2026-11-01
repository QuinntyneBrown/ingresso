using Ingresso.Application.Common.Interfaces;
using Ingresso.Application.Common.Messages;

namespace Ingresso.Infrastructure.Email;

public sealed class SendEmailHandler(IEmailSender sender) : IOutboxMessageHandler<SendEmail>
{
    public Task HandleAsync(SendEmail message, CancellationToken cancellationToken) =>
        sender.SendAsync(message.Email, cancellationToken);
}
