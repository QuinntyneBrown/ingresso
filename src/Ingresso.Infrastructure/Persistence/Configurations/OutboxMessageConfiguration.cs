using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Ingresso.Domain.Entities;

namespace Ingresso.Infrastructure.Persistence.Configurations;

public sealed class OutboxMessageConfiguration : IEntityTypeConfiguration<OutboxMessage>
{
    public void Configure(EntityTypeBuilder<OutboxMessage> builder)
    {
        builder.HasKey(m => m.Id);
        builder.Property(m => m.Type).HasMaxLength(500).IsRequired();
        // Bounded so the migration uses no SQL Server-only nvarchar(max) and also applies on SQLite.
        builder.Property(m => m.Payload).HasMaxLength(4000).IsRequired();
        builder.Property(m => m.CorrelationId).HasMaxLength(64);
        builder.Property(m => m.LastError).HasMaxLength(2000);
        builder.HasIndex(m => new { m.ProcessedAtUtc, m.FailedAtUtc, m.NextAttemptAtUtc });
    }
}
