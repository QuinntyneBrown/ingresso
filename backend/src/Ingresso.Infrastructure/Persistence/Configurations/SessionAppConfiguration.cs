using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Ingresso.Domain.Entities;

namespace Ingresso.Infrastructure.Persistence.Configurations;

public sealed class SessionAppConfiguration : IEntityTypeConfiguration<SessionApp>
{
    public void Configure(EntityTypeBuilder<SessionApp> builder)
    {
        builder.HasKey(a => new { a.SessionId, a.ClientId });
        builder.Property(a => a.ClientId).HasMaxLength(100);
        builder.HasOne(a => a.Session).WithMany().HasForeignKey(a => a.SessionId).OnDelete(DeleteBehavior.Cascade);
    }
}
