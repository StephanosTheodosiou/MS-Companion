using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MSCompanion.Data.Models;

namespace MSCompanion.Data.Configurations;

public class MedicationConfiguration : IEntityTypeConfiguration<Medication>
{
    public void Configure(EntityTypeBuilder<Medication> builder)
    {
        builder.ToTable("medication", t => t.HasCheckConstraint(
            "ck_medication_dates", "end_date IS NULL OR start_date IS NULL OR end_date >= start_date"));

        builder.OwnedByPatient(p => p.Medications);

        // Lets schedules and intakes reference (id, patient_id) together, so the database itself
        // guarantees a child row can never point at another patient's medicine.
        builder.HasAlternateKey(m => new { m.Id, m.PatientId });

        builder.Property(m => m.Name).HasMaxLength(200);
        builder.Property(m => m.Dose).HasMaxLength(100);
        builder.Property(m => m.Instructions).HasMaxLength(500);
    }
}

public class MedicationScheduleConfiguration : IEntityTypeConfiguration<MedicationSchedule>
{
    public void Configure(EntityTypeBuilder<MedicationSchedule> builder)
    {
        builder.ToTable("medication_schedule", t => t.HasCheckConstraint(
            "ck_medication_schedule_days", "days BETWEEN 1 AND 127"));

        builder.OwnedByPatient();

        builder.HasOne(s => s.Medication)
            .WithMany(m => m.Schedules)
            .HasForeignKey(s => new { s.MedicationId, s.PatientId })
            .HasPrincipalKey(m => new { m.Id, m.PatientId })
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class MedicationIntakeConfiguration : IEntityTypeConfiguration<MedicationIntake>
{
    public void Configure(EntityTypeBuilder<MedicationIntake> builder)
    {
        builder.ToTable("medication_intake");

        builder.OwnedByPatient();

        builder.HasOne(i => i.Medication)
            .WithMany(m => m.Intakes)
            .HasForeignKey(i => new { i.MedicationId, i.PatientId })
            .HasPrincipalKey(m => new { m.Id, m.PatientId })
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(i => i.Schedule)
            .WithMany(s => s.Intakes)
            .HasForeignKey(i => i.ScheduleId)
            .OnDelete(DeleteBehavior.SetNull);

        // A reminder slot can only be answered once.
        builder.HasIndex(i => new { i.ScheduleId, i.ScheduledFor })
            .IsUnique()
            .HasFilter("deleted_at IS NULL AND schedule_id IS NOT NULL");

        // Adherence over a date range for the report.
        builder.HasIndex(i => new { i.PatientId, i.MedicationId, i.ScheduledFor });

        builder.Property(i => i.Note).HasMaxLength(500);
    }
}

public class SideEffectConfiguration : IEntityTypeConfiguration<SideEffect>
{
    public void Configure(EntityTypeBuilder<SideEffect> builder)
    {
        builder.ToTable("side_effect", t => t.HasCheckConstraint(
            "ck_side_effect_dates", "ended_on IS NULL OR ended_on >= started_on"));

        builder.OwnedByPatient();

        builder.HasOne(s => s.Medication)
            .WithMany(m => m.SideEffects)
            .HasForeignKey(s => s.MedicationId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Property(s => s.Description).HasMaxLength(500);
        builder.Property(s => s.Note).HasMaxLength(1000);
    }
}

public class BloodTestReminderConfiguration : IEntityTypeConfiguration<BloodTestReminder>
{
    public void Configure(EntityTypeBuilder<BloodTestReminder> builder)
    {
        builder.ToTable("blood_test_reminder", t => t.HasCheckConstraint(
            "ck_blood_test_reminder_repeat", "repeat_every_weeks IS NULL OR repeat_every_weeks > 0"));

        builder.OwnedByPatient(p => p.BloodTestReminders);

        builder.HasOne(r => r.Medication)
            .WithMany(m => m.BloodTestReminders)
            .HasForeignKey(r => r.MedicationId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(r => new { r.PatientId, r.DueDate });

        builder.Property(r => r.TestName).HasMaxLength(150);
    }
}
