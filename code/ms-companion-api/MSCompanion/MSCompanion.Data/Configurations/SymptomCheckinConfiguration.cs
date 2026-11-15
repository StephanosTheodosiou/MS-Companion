using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MSCompanion.Data.Models;

namespace MSCompanion.Data.Configurations;

public class SymptomCheckinConfiguration : IEntityTypeConfiguration<SymptomCheckin>
{
    public void Configure(EntityTypeBuilder<SymptomCheckin> builder)
    {
        builder.ToTable("symptom_checkin", t =>
        {
            foreach (var col in new[] { "fatigue", "mobility", "pain", "mood", "cognition", "bladder" })
            {
                t.HasCheckConstraint($"ck_symptom_checkin_{col}", $"{col} BETWEEN 0 AND 4");
            }
        });

        builder.OwnedByPatient(p => p.SymptomCheckins);

        // One live check-in per patient per day. Filtered so a deleted check-in
        // does not block a new one for the same day.
        builder.HasIndex(c => new { c.PatientId, c.CheckinDate })
            .IsUnique()
            .HasFilter("deleted_at IS NULL");

        builder.Property(c => c.Note).HasMaxLength(1000);
    }
}
