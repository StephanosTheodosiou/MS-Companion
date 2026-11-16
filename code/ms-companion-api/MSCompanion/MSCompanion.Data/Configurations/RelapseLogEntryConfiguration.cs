using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MSCompanion.Data.Models;

namespace MSCompanion.Data.Configurations;

public class RelapseLogEntryConfiguration : IEntityTypeConfiguration<RelapseLogEntry>
{
    public void Configure(EntityTypeBuilder<RelapseLogEntry> builder)
    {
        builder.ToTable("relapse_log_entry", t => t.HasCheckConstraint(
            "ck_relapse_log_entry_dates", "resolved_on IS NULL OR resolved_on >= onset_date"));

        builder.OwnedByPatient(p => p.RelapseLogEntries);

        builder.HasIndex(r => new { r.PatientId, r.OnsetDate });

        builder.Property(r => r.SymptomDescription).HasMaxLength(500);
        builder.Property(r => r.BodyArea).HasMaxLength(100);
        builder.Property(r => r.Note).HasMaxLength(1000);
    }
}
