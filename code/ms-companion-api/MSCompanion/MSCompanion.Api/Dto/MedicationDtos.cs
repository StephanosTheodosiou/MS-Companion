using System.ComponentModel.DataAnnotations;
using MSCompanion.Data.Models;
using MSCompanion.Domain.Enums;

namespace MSCompanion.Api.Dto;

public sealed class MedicationDto
{
    public required Guid Id { get; init; }
    public required string Name { get; init; }
    public string? Dose { get; init; }
    public string? Instructions { get; init; }
    public required bool IsDiseaseModifying { get; init; }
    public required MedicationStatus Status { get; init; }
    public DateOnly? StartDate { get; init; }
    public DateOnly? EndDate { get; init; }
    public required List<MedicationScheduleDto> Schedules { get; init; }
    public required DateTimeOffset UpdatedAt { get; init; }

    public static MedicationDto FromEntity(Medication m) => new()
    {
        Id = m.Id,
        Name = m.Name,
        Dose = m.Dose,
        Instructions = m.Instructions,
        IsDiseaseModifying = m.IsDiseaseModifying,
        Status = m.Status,
        StartDate = m.StartDate,
        EndDate = m.EndDate,
        Schedules = m.Schedules
            .Where(s => s.DeletedAt is null)
            .OrderBy(s => s.TimeOfDay)
            .Select(MedicationScheduleDto.FromEntity)
            .ToList(),
        UpdatedAt = m.UpdatedAt,
    };
}

public sealed class MedicationScheduleDto
{
    public required Guid Id { get; init; }
    public required TimeOnly TimeOfDay { get; init; }
    public required List<DayOfWeek> Days { get; init; }
    public required bool ReminderEnabled { get; init; }

    public static MedicationScheduleDto FromEntity(MedicationSchedule s) => new()
    {
        Id = s.Id,
        TimeOfDay = s.TimeOfDay,
        Days = WeekdaysMapper.ToDays(s.Days),
        ReminderEnabled = s.ReminderEnabled,
    };
}

public sealed class MedicationIntakeDto
{
    public required Guid Id { get; init; }
    public required Guid MedicationId { get; init; }
    public Guid? ScheduleId { get; init; }
    public DateTimeOffset? ScheduledFor { get; init; }
    public required IntakeStatus Status { get; init; }
    public DateTimeOffset? TakenAt { get; init; }
    public string? Note { get; init; }

    public static MedicationIntakeDto FromEntity(MedicationIntake i) => new()
    {
        Id = i.Id,
        MedicationId = i.MedicationId,
        ScheduleId = i.ScheduleId,
        ScheduledFor = i.ScheduledFor,
        Status = i.Status,
        TakenAt = i.TakenAt,
        Note = i.Note,
    };
}

public sealed class SaveMedicationRequest : IValidatableObject
{
    [Required, MaxLength(200)]
    public required string Name { get; init; }

    [MaxLength(100)]
    public string? Dose { get; init; }

    [MaxLength(500)]
    public string? Instructions { get; init; }

    public bool IsDiseaseModifying { get; init; }

    public MedicationStatus Status { get; init; } = MedicationStatus.Active;

    public DateOnly? StartDate { get; init; }

    public DateOnly? EndDate { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (string.IsNullOrWhiteSpace(Name))
        {
            yield return new ValidationResult("Name is required.", [nameof(Name)]);
        }

        if (StartDate is { } start && EndDate is { } end && end < start)
        {
            yield return new ValidationResult("End date cannot be before the start date.", [nameof(EndDate)]);
        }
    }
}

public sealed class SaveScheduleRequest : IValidatableObject
{
    [Required]
    public TimeOnly? TimeOfDay { get; init; }

    [Required, MinLength(1), MaxLength(7)]
    public required List<DayOfWeek> Days { get; init; }

    public bool ReminderEnabled { get; init; } = true;

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (Days.Distinct().Count() != Days.Count)
        {
            yield return new ValidationResult("Each day may appear only once.", [nameof(Days)]);
        }
    }
}

public sealed class LogIntakeRequest : IValidatableObject
{
    public Guid? ScheduleId { get; init; }

    public DateTimeOffset? ScheduledFor { get; init; }

    [Required]
    public IntakeStatus? Status { get; init; }

    public DateTimeOffset? TakenAt { get; init; }

    [MaxLength(500)]
    public string? Note { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (ScheduleId is not null && ScheduledFor is null)
        {
            yield return new ValidationResult("A scheduled dose needs the reminder time.", [nameof(ScheduledFor)]);
        }

        if (ScheduleId is null && ScheduledFor is not null)
        {
            yield return new ValidationResult("A reminder time needs a schedule.", [nameof(ScheduleId)]);
        }

        if (ScheduleId is null && Status != IntakeStatus.Taken)
        {
            yield return new ValidationResult("A dose without a schedule can only be Taken.", [nameof(Status)]);
        }

        if (Status != IntakeStatus.Taken && TakenAt is not null)
        {
            yield return new ValidationResult("Only a taken dose has a taken time.", [nameof(TakenAt)]);
        }
    }
}

public static class WeekdaysMapper
{
    public static Weekdays ToFlags(IEnumerable<DayOfWeek> days) =>
        days.Aggregate(Weekdays.None, (flags, day) => flags | ToFlag(day));

    public static List<DayOfWeek> ToDays(Weekdays flags) =>
        Enum.GetValues<DayOfWeek>().Where(d => flags.HasFlag(ToFlag(d))).ToList();

    private static Weekdays ToFlag(DayOfWeek day) => day switch
    {
        DayOfWeek.Monday => Weekdays.Monday,
        DayOfWeek.Tuesday => Weekdays.Tuesday,
        DayOfWeek.Wednesday => Weekdays.Wednesday,
        DayOfWeek.Thursday => Weekdays.Thursday,
        DayOfWeek.Friday => Weekdays.Friday,
        DayOfWeek.Saturday => Weekdays.Saturday,
        _ => Weekdays.Sunday,
    };
}
