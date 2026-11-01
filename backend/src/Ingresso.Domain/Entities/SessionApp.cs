namespace Ingresso.Domain.Entities;

/// <summary>An app (OpenID Connect client) that signed in under an ingresso session, so signing out can notify it (L2-099).</summary>
public class SessionApp
{
    public Guid SessionId { get; set; }
    public Session? Session { get; set; }
    public string ClientId { get; set; } = "";
    public DateTimeOffset SignedInAtUtc { get; set; }
}
