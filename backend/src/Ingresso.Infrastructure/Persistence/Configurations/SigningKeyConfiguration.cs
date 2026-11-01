using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Ingresso.Domain.Entities;

namespace Ingresso.Infrastructure.Persistence.Configurations;

public sealed class SigningKeyConfiguration : IEntityTypeConfiguration<SigningKey>
{
    public void Configure(EntityTypeBuilder<SigningKey> builder)
    {
        builder.HasKey(k => k.Id);
        builder.Property(k => k.Kid).HasMaxLength(32);
        builder.HasIndex(k => k.Kid).IsUnique();
        builder.Property(k => k.ProtectedKey).IsRequired();
    }
}
