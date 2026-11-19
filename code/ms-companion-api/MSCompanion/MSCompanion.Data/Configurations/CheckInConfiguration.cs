using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MSCompanion.Data.Models;
using MSCompanion.Domain.Enums;
using MSCompanion.Domain.Fhir;

namespace MSCompanion.Data.Configurations;

public class CheckInConfiguration : IEntityTypeConfiguration<CheckIn>
{
    public void Configure(EntityTypeBuilder<CheckIn> builder)
    {
        builder.ToTable("check_in");

        builder.OwnedByPatient(p => p.CheckIns);

        builder.HasIndex(c => new { c.PatientId, c.LocalDate })
            .IsUnique()
            .HasFilter("deleted_at IS NULL");

        builder.Property(c => c.TimeZone).HasMaxLength(64);
        builder.Property(c => c.QuestionnaireVersion).HasMaxLength(20);
        builder.Property(c => c.Note).HasMaxLength(1000);
    }
}

public class CheckInAnswerConfiguration : IEntityTypeConfiguration<CheckInAnswer>
{
    public void Configure(EntityTypeBuilder<CheckInAnswer> builder)
    {
        builder.ToTable("check_in_answer", t =>
        {
            t.HasCheckConstraint("ck_check_in_answer_item", CheckConstraintSql.OneOf<CheckInItem>("item"));
            t.HasCheckConstraint(
                "ck_check_in_answer_score",
                $"score BETWEEN {DailyCheckInQuestionnaire.MinScore} AND {DailyCheckInQuestionnaire.MaxScore}");
        });

        builder.HasKey(a => new { a.CheckInId, a.Item });

        builder.HasOne(a => a.CheckIn)
            .WithMany(c => c.Answers)
            .HasForeignKey(a => a.CheckInId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasQueryFilter(a => a.CheckIn.DeletedAt == null);
    }
}
