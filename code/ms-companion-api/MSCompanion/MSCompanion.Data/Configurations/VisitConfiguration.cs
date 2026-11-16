using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MSCompanion.Data.Models;

namespace MSCompanion.Data.Configurations;

public class AppointmentConfiguration : IEntityTypeConfiguration<Appointment>
{
    public void Configure(EntityTypeBuilder<Appointment> builder)
    {
        builder.ToTable("appointment");

        builder.OwnedByPatient(p => p.Appointments);

        builder.HasIndex(a => new { a.PatientId, a.StartsAt });

        builder.Property(a => a.ClinicianName).HasMaxLength(150);
        builder.Property(a => a.Location).HasMaxLength(200);
        builder.Property(a => a.Note).HasMaxLength(1000);
    }
}

public class VisitQuestionConfiguration : IEntityTypeConfiguration<VisitQuestion>
{
    public void Configure(EntityTypeBuilder<VisitQuestion> builder)
    {
        builder.ToTable("visit_question");

        builder.OwnedByPatient(p => p.VisitQuestions);

        builder.HasOne(q => q.Appointment)
            .WithMany(a => a.Questions)
            .HasForeignKey(q => q.AppointmentId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Property(q => q.Text).HasMaxLength(1000);
        builder.Property(q => q.AnswerNote).HasMaxLength(1000);
    }
}

public class VisitReportConfiguration : IEntityTypeConfiguration<VisitReport>
{
    public void Configure(EntityTypeBuilder<VisitReport> builder)
    {
        builder.ToTable("visit_report", t => t.HasCheckConstraint(
            "ck_visit_report_period", "period_end >= period_start"));

        builder.OwnedByPatient(p => p.VisitReports);

        builder.HasOne(r => r.Appointment)
            .WithMany(a => a.Reports)
            .HasForeignKey(r => r.AppointmentId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(r => new { r.PatientId, r.GeneratedAt });

        builder.Property(r => r.FhirBundleJson).HasColumnType("jsonb");
        builder.Property(r => r.FhirVersion).HasMaxLength(10);
    }
}
