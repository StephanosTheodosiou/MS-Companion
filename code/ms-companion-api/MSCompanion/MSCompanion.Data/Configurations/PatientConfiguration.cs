using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MSCompanion.Data.Models;

namespace MSCompanion.Data.Configurations;

public class PatientConfiguration : IEntityTypeConfiguration<Patient>
{
    public void Configure(EntityTypeBuilder<Patient> builder)
    {
        builder.ToTable("patient", t => t.HasCheckConstraint(
            "ck_patient_diagnosis_year", "diagnosis_year IS NULL OR diagnosis_year BETWEEN 1950 AND 2100"));

        builder.HasKey(p => p.Id);
        builder.Property(p => p.Id).ValueGeneratedNever();

        builder.HasOne(p => p.User)
            .WithOne(u => u.Patient)
            .HasForeignKey<Patient>(p => p.UserId)
            .OnDelete(DeleteBehavior.Cascade); // delete account => erase all health data

        builder.HasIndex(p => p.UserId).IsUnique();

        builder.Property(p => p.PreferredName).HasMaxLength(100);
        builder.Property(p => p.MsTeamName).HasMaxLength(150);
        builder.Property(p => p.MsTeamPhone).HasMaxLength(30);
        builder.Property(p => p.TimeZone).HasMaxLength(64);
    }
}
