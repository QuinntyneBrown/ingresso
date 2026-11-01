namespace Ingresso.Infrastructure.Email;

public sealed class EmailOptions
{
    public const string Section = "Email";

    public const string DevMailboxProvider = "DevMailbox";
    public const string AzureCommunicationServicesProvider = "AzureCommunicationServices";

    /// <summary>Which <c>IEmailSender</c> sends mail: <c>DevMailbox</c> (default; nothing leaves the machine) or
    /// <c>AzureCommunicationServices</c>.</summary>
    public string Provider { get; set; } = DevMailboxProvider;

    /// <summary>The sender address, which must belong to a domain verified with the provider.</summary>
    public string From { get; set; } = "noreply@ingresso.ca";

    public AzureCommunicationServicesOptions AzureCommunicationServices { get; set; } = new();

    public sealed class AzureCommunicationServicesOptions
    {
        /// <summary>The Communication Services resource connection string (<c>endpoint=...;accesskey=...</c>).</summary>
        public string? ConnectionString { get; set; }
    }
}
