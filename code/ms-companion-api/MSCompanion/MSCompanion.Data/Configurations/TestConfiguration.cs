using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MSCompanion.Data.Models;
using MSCompanion.Domain.Enums;
using MSCompanion.Domain.Fhir;

namespace MSCompanion.Data.Configurations;

public class TestSessionConfiguration : IEntityTypeConfiguration<TestSession>
{
    public void Configure(EntityTypeBuilder<TestSession> builder)
    {
        builder.ToTable("test_session", t =>
        {
            t.HasCheckConstraint("ck_test_session_test_type", CheckConstraintSql.OneOf<TestType>("test_type"));
            t.HasCheckConstraint("ck_test_session_status", CheckConstraintSql.OneOf<TestSessionStatus>("status"));
            t.HasCheckConstraint("ck_test_session_times", "ended_at >= started_at");
        });

        builder.OwnedByPatient(p => p.TestSessions);

        builder.HasAlternateKey(s => new { s.Id, s.TestType });

        builder.HasIndex(s => new { s.PatientId, s.TestType, s.StartedAt })
            .HasDatabaseName("ix_test_session_trend")
            .HasFilter($"status = '{nameof(TestSessionStatus.Completed)}' AND NOT is_practice AND deleted_at IS NULL");

        builder.Property(s => s.TimeZone).HasMaxLength(64);
        builder.Property(s => s.AppVersion).HasMaxLength(32);
        builder.Property(s => s.DeviceModel).HasMaxLength(100);
    }
}

public class TestMetricConfiguration : IEntityTypeConfiguration<TestMetric>
{
    public void Configure(EntityTypeBuilder<TestMetric> builder)
    {
        builder.ToTable("test_metric", t =>
            t.HasCheckConstraint("ck_test_metric_test_type", CheckConstraintSql.OneOf<TestType>("test_type")));

        builder.HasKey(m => m.Code);

        builder.HasAlternateKey(m => new { m.Code, m.TestType });

        builder.Property(m => m.Code).HasMaxLength(64);
        builder.Property(m => m.Display).HasMaxLength(200);
        builder.Property(m => m.Unit).HasMaxLength(32);

        builder.HasData(TestMetrics.All.Select(m => new TestMetric
        {
            Code = m.Code,
            TestType = m.TestType,
            Display = m.Display,
            Unit = m.UcumUnit,
        }));
    }
}

public class TestResultConfiguration : IEntityTypeConfiguration<TestResult>
{
    public void Configure(EntityTypeBuilder<TestResult> builder)
    {
        builder.ToTable("test_result", t =>
        {
            t.HasCheckConstraint("ck_test_result_test_type", CheckConstraintSql.OneOf<TestType>("test_type"));
            t.HasCheckConstraint("ck_test_result_laterality", CheckConstraintSql.OneOf<Laterality>("laterality"));

            t.HasCheckConstraint(
                "ck_test_result_laterality_required",
                $"(test_type = '{nameof(TestType.FingerTapping)}') = (laterality IS NOT NULL)");

            t.HasCheckConstraint("ck_test_result_value", "value >= 0");
        });

        builder.HasKey(r => r.Id);
        builder.Property(r => r.Id).ValueGeneratedNever();

        builder.HasOne(r => r.Session)
            .WithMany(s => s.Results)
            .HasForeignKey(r => new { r.SessionId, r.TestType })
            .HasPrincipalKey(s => new { s.Id, s.TestType })
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(r => r.Metric)
            .WithMany()
            .HasForeignKey(r => new { r.MetricCode, r.TestType })
            .HasPrincipalKey(m => new { m.Code, m.TestType })
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(r => new { r.SessionId, r.MetricCode, r.Laterality })
            .IsUnique()
            .AreNullsDistinct(false);

        builder.Property(r => r.MetricCode).HasMaxLength(64);
        builder.Property(r => r.Value).HasColumnType("numeric");

        builder.HasQueryFilter(r => r.Session.DeletedAt == null);
    }
}

public class TestRawDataConfiguration : IEntityTypeConfiguration<TestRawData>
{
    public void Configure(EntityTypeBuilder<TestRawData> builder)
    {
        builder.ToTable("test_raw_data", t =>
            t.HasCheckConstraint("ck_test_raw_data_format_version", "format_version > 0"));

        builder.HasKey(r => r.SessionId);

        builder.HasOne(r => r.Session)
            .WithOne(s => s.RawData)
            .HasForeignKey<TestRawData>(r => r.SessionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Property(r => r.Payload).HasColumnType("jsonb");

        builder.HasQueryFilter(r => r.Session.DeletedAt == null);
    }
}
