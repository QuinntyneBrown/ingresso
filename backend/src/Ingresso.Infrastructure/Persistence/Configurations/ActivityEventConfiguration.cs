using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Ingresso.Domain.Entities;

namespace Ingresso.Infrastructure.Persistence.Configurations;

public sealed class ActivityEventConfiguration : IEntityTypeConfiguration<ActivityEvent>
{
    public void Configure(EntityTypeBuilder<ActivityEvent> builder)
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).ValueGeneratedOnAdd();
        builder.Property(e => e.Type).HasConversion<string>().HasMaxLength(40);
        builder.Property(e => e.Subject).HasMaxLength(200);
        builder.HasIndex(e => new { e.UserId, e.Id });
        builder.HasIndex(e => e.OccurredAtUtc);
    }
}
