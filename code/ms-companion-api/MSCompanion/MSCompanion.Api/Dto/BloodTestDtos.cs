using System.ComponentModel.DataAnnotations;
using MSCompanion.Data.Models;
using MSCompanion.Domain.Rules;

namespace MSCompanion.Api.Dto;

public enum BloodTestStatus
{
    Upcoming,
    Overdue,
    Completed,
}

public sealed class BloodTestDto
{
    public required Guid Id { get; init; }
    public required string TestName { get; init; }
    public Guid? MedicationId { get; init; }
    public string? MedicationName { get; init; }
    public required DateOnly DueDate { get; init; }
    public short? RepeatEveryWeeks { get; init; }
    public DateOnly? CompletedOn { get; init; }
    public required bool ReminderEnabled { get; init; }
    public required BloodTestStatus Status { get; init; }
    public required DateTimeOffset CreatedAt { get; init; }
    public required DateTimeOffset UpdatedAt { get; init; }

    public static BloodTestStatus StatusOf(BloodTestReminder r, DateOnly today) =>
        r.CompletedOn is not null ? BloodTestStatus.Completed
        : r.DueDate < today ? BloodTestStatus.Overdue
        : BloodTestStatus.Upcoming;

    public static BloodTestDto FromEntity(BloodTestReminder r, DateOnly today) => new()
    {
        Id = r.Id,
        TestName = r.TestName,
        MedicationId = r.MedicationId,
        MedicationName = r.Medication?.Name,
        DueDate = r.DueDate,
        RepeatEveryWeeks = r.RepeatEveryWeeks,
        CompletedOn = r.CompletedOn,
        ReminderEnabled = r.ReminderEnabled,
        Status = StatusOf(r, today),
        CreatedAt = r.CreatedAt,
        UpdatedAt = r.UpdatedAt,
    };
}

public sealed class CompleteBloodTestResponse
{
    public required BloodTestDto Completed { get; init; }

    public BloodTestDto? Next { get; init; }
}

public sealed class SaveBloodTestRequest : IValidatableObject
{
    [Required, MaxLength(BloodTestRules.TestNameMaxLength)]
    public required string TestName { get; init; }

    public Guid? MedicationId { get; init; }

    [Required]
    public DateOnly? DueDate { get; init; }

    public short? RepeatEveryWeeks { get; init; }

    public bool ReminderEnabled { get; init; } = true;

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (string.IsNullOrWhiteSpace(TestName))
        {
            yield return new ValidationResult("Name the blood test.", [nameof(TestName)]);
        }

        if (!BloodTestRules.RepeatValid(RepeatEveryWeeks))
        {
            yield return new ValidationResult(
                $"Repeat must be between {BloodTestRules.MinRepeatWeeks} and {BloodTestRules.MaxRepeatWeeks} weeks.",
                [nameof(RepeatEveryWeeks)]);
        }
    }
}

public sealed class CompleteBloodTestRequest
{
    [Required]
    public DateOnly? CompletedOn { get; init; }
}
