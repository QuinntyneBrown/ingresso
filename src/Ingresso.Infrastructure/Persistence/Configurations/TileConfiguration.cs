using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Ingresso.Domain.Entities;

namespace Ingresso.Infrastructure.Persistence.Configurations;

public sealed class TileConfiguration : IEntityTypeConfiguration<Tile>
{
    public void Configure(EntityTypeBuilder<Tile> builder)
    {
        builder.HasKey(t => t.Id);
        builder.Property(t => t.Name).HasMaxLength(80).IsRequired();
        builder.Property(t => t.Url).HasMaxLength(2048).IsRequired();
        builder.Property(t => t.Description).HasMaxLength(300);
        builder.Property(t => t.Color).HasMaxLength(7).IsRequired();
        builder.Property(t => t.Initial).HasMaxLength(2).IsRequired();
        builder.Property(t => t.Category).HasMaxLength(60);
        builder.HasOne<User>().WithMany().HasForeignKey(t => t.OwnerId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(t => new { t.OwnerId, t.Y, t.X });
    }
}
