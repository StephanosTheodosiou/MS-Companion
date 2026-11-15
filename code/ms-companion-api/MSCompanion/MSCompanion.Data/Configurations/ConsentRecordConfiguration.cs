using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MSCompanion.Data.Models;

namespace MSCompanion.Data.Configurations;

/// <summary>Append-only, so no soft delete and no query filter (it is not a <see cref="PatientOwnedEntity"/>).</summary>
public class ConsentRecordConfiguration : IEntityTypeConfiguration<ConsentRecord>
{
    public void Configure(EntityTypeBuilder<ConsentRecord> builder)
    {
        builder.ToTable("consent_record");

        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).ValueGeneratedNever();

        builder.HasOne(c => c.Patient)
            .WithMany(p => p.ConsentRecords)
            .HasForeignKey(c => c.PatientId)
            .OnDelete(DeleteBehavior.Cascade);

        // Current consent = latest row per (patient, data_type).
        builder.HasIndex(c => new { c.PatientId, c.DataType, c.CreatedAt });
        builder.HasIndex(c => new { c.PatientId, c.ServerUpdatedAt });

        builder.Property(c => c.PolicyVersion).HasMaxLength(32);
    }
}
