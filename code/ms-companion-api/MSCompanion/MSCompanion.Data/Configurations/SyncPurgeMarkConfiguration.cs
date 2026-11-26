using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MSCompanion.Data.Models;

namespace MSCompanion.Data.Configurations;

public class SyncPurgeMarkConfiguration : IEntityTypeConfiguration<SyncPurgeMark>
{
    public void Configure(EntityTypeBuilder<SyncPurgeMark> builder)
    {
        builder.ToTable("sync_purge_mark");

        builder.HasKey(m => new { m.PatientId, m.TableName });

        builder.HasOne(m => m.Patient)
            .WithMany()
            .HasForeignKey(m => m.PatientId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Property(m => m.TableName).HasMaxLength(63);
    }
}
