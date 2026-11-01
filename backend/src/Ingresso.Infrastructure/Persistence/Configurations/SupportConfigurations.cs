using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Ingresso.Domain.Entities;

namespace Ingresso.Infrastructure.Persistence.Configurations;

public sealed class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> builder)
    {
        builder.HasKey(n => n.Id);
        builder.Property(n => n.RecipientEmail).HasMaxLength(254);
        builder.Property(n => n.Title).HasMaxLength(200);
        builder.Property(n => n.Text).HasMaxLength(500);
        builder.Property(n => n.Link).HasMaxLength(300);
        builder.HasIndex(n => new { n.RecipientEmail, n.CreatedAtUtc });
    }
}

public sealed class AuditEntryConfiguration : IEntityTypeConfiguration<AuditEntry>
{
    public void Configure(EntityTypeBuilder<AuditEntry> builder)
    {
        builder.HasKey(a => a.Sequence);
        builder.Property(a => a.Sequence).ValueGeneratedOnAdd();
        builder.Property(a => a.Action).HasMaxLength(60);
        builder.Property(a => a.TargetType).HasMaxLength(60);
        builder.HasIndex(a => a.TargetId);
    }
}
