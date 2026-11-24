using System.ComponentModel.DataAnnotations;
using MSCompanion.Data.Models;
using MSCompanion.Domain.Enums;

namespace MSCompanion.Api.Dto;

public sealed class SyncPushRequest
{
    [Required, MaxLength(50)]
    public List<CheckInSyncDto> CheckIns { get; init; } = [];

    [Required, MaxLength(50)]
    public List<MedicationSyncDto> Medications { get; init; } = [];

    [Required, MaxLength(50)]
    public List<MedicationScheduleSyncDto> MedicationSchedules { get; init; } = [];

    [Required, MaxLength(100)]
    public List<MedicationIntakeSyncDto> MedicationIntakes { get; init; } = [];

    [Required, MaxLength(50)]
    public List<RelapseLogEntrySyncDto> RelapseLogEntries { get; init; } = [];

    [Required, MaxLength(50)]
    public List<AppointmentSyncDto> Appointments { get; init; } = [];

    [Required, MaxLength(50)]
    public List<VisitQuestionSyncDto> VisitQuestions { get; init; } = [];

    [Required, MaxLength(50)]
    public List<SideEffectSyncDto> SideEffects { get; init; } = [];

    public bool IsEmpty() =>
        CheckIns.Count == 0
        && Medications.Count == 0
        && MedicationSchedules.Count == 0
        && MedicationIntakes.Count == 0
        && RelapseLogEntries.Count == 0
        && Appointments.Count == 0
        && VisitQuestions.Count == 0
        && SideEffects.Count == 0;
}

public sealed class SyncPushResponse
{
    public List<SyncRecordResult<CheckInSyncDto>> CheckIns { get; init; } = [];
    public List<SyncRecordResult<MedicationSyncDto>> Medications { get; init; } = [];
    public List<SyncRecordResult<MedicationScheduleSyncDto>> MedicationSchedules { get; init; } = [];
    public List<SyncRecordResult<MedicationIntakeSyncDto>> MedicationIntakes { get; init; } = [];
    public List<SyncRecordResult<RelapseLogEntrySyncDto>> RelapseLogEntries { get; init; } = [];
    public List<SyncRecordResult<AppointmentSyncDto>> Appointments { get; init; } = [];
    public List<SyncRecordResult<VisitQuestionSyncDto>> VisitQuestions { get; init; } = [];
    public List<SyncRecordResult<SideEffectSyncDto>> SideEffects { get; init; } = [];
}

public sealed class SyncPullResponse
{
    public required List<CheckInSyncDto> CheckIns { get; init; }
    public required List<MedicationSyncDto> Medications { get; init; }
    public required List<MedicationScheduleSyncDto> MedicationSchedules { get; init; }
    public required List<MedicationIntakeSyncDto> MedicationIntakes { get; init; }
    public required List<RelapseLogEntrySyncDto> RelapseLogEntries { get; init; }
    public required List<AppointmentSyncDto> Appointments { get; init; }
    public required List<VisitQuestionSyncDto> VisitQuestions { get; init; }
    public required List<SideEffectSyncDto> SideEffects { get; init; }

    public required string? Cursor { get; init; }

    public required bool HasMore { get; init; }
}

public enum SyncOutcome
{
    Accepted,
    Rejected,
    Conflict,
}

public sealed class SyncRecordResult<T>
    where T : class
{
    public required Guid Id { get; init; }

    public required SyncOutcome Outcome { get; init; }

    public string? Reason { get; init; }

    public T? ServerCopy { get; init; }

    public static SyncRecordResult<T> Accepted(Guid id) => new() { Id = id, Outcome = SyncOutcome.Accepted };

    public static SyncRecordResult<T> Rejected(Guid id, string reason) =>
        new() { Id = id, Outcome = SyncOutcome.Rejected, Reason = reason };

    public static SyncRecordResult<T> Conflict(Guid id, T serverCopy) =>
        new() { Id = id, Outcome = SyncOutcome.Conflict, ServerCopy = serverCopy };
}

public interface ISyncItem
{
    Guid Id { get; }
    DateTimeOffset CreatedAt { get; }
    DateTimeOffset UpdatedAt { get; }
    DateTimeOffset? DeletedAt { get; }
}

public sealed class CheckInSyncDto
{
    public required Guid Id { get; init; }

    public required DateOnly LocalDate { get; init; }

    public required string TimeZone { get; init; }

    public required string QuestionnaireVersion { get; init; }

    public string? Note { get; init; }

    public required List<CheckInAnswerSyncDto> Answers { get; init; }

    public required DateTimeOffset CreatedAt { get; init; }

    public required DateTimeOffset UpdatedAt { get; init; }

    public DateTimeOffset? DeletedAt { get; init; }

    public static CheckInSyncDto FromEntity(CheckIn checkIn) => new()
    {
        Id = checkIn.Id,
        LocalDate = checkIn.LocalDate,
        TimeZone = checkIn.TimeZone,
        QuestionnaireVersion = checkIn.QuestionnaireVersion,
        Note = checkIn.Note,
        Answers = checkIn.Answers
            .OrderBy(a => a.Item)
            .Select(a => new CheckInAnswerSyncDto { Item = a.Item, Score = a.Score })
            .ToList(),
        CreatedAt = checkIn.CreatedAt,
        UpdatedAt = checkIn.UpdatedAt,
        DeletedAt = checkIn.DeletedAt,
    };
}

public sealed class CheckInAnswerSyncDto
{
    public required CheckInItem Item { get; init; }

    public required short Score { get; init; }
}

public sealed class MedicationSyncDto : ISyncItem
{
    public required Guid Id { get; init; }
    public required string Name { get; init; }
    public string? Dose { get; init; }
    public string? Instructions { get; init; }
    public bool IsDiseaseModifying { get; init; }
    public MedicationStatus Status { get; init; }
    public DateOnly? StartDate { get; init; }
    public DateOnly? EndDate { get; init; }
    public required DateTimeOffset CreatedAt { get; init; }
    public required DateTimeOffset UpdatedAt { get; init; }
    public DateTimeOffset? DeletedAt { get; init; }

    public static MedicationSyncDto FromEntity(Medication m) => new()
    {
        Id = m.Id,
        Name = m.Name,
        Dose = m.Dose,
        Instructions = m.Instructions,
        IsDiseaseModifying = m.IsDiseaseModifying,
        Status = m.Status,
        StartDate = m.StartDate,
        EndDate = m.EndDate,
        CreatedAt = m.CreatedAt,
        UpdatedAt = m.UpdatedAt,
        DeletedAt = m.DeletedAt,
    };
}

public sealed class MedicationScheduleSyncDto : ISyncItem
{
    public required Guid Id { get; init; }
    public required Guid MedicationId { get; init; }
    public required TimeOnly TimeOfDay { get; init; }
    public required List<DayOfWeek> Days { get; init; }
    public bool ReminderEnabled { get; init; } = true;
    public required DateTimeOffset CreatedAt { get; init; }
    public required DateTimeOffset UpdatedAt { get; init; }
    public DateTimeOffset? DeletedAt { get; init; }

    public static MedicationScheduleSyncDto FromEntity(MedicationSchedule s) => new()
    {
        Id = s.Id,
        MedicationId = s.MedicationId,
        TimeOfDay = s.TimeOfDay,
        Days = WeekdaysMapper.ToDays(s.Days),
        ReminderEnabled = s.ReminderEnabled,
        CreatedAt = s.CreatedAt,
        UpdatedAt = s.UpdatedAt,
        DeletedAt = s.DeletedAt,
    };
}

public sealed class MedicationIntakeSyncDto : ISyncItem
{
    public required Guid Id { get; init; }
    public required Guid MedicationId { get; init; }
    public Guid? ScheduleId { get; init; }
    public DateTimeOffset? ScheduledFor { get; init; }
    public required IntakeStatus Status { get; init; }
    public DateTimeOffset? TakenAt { get; init; }
    public string? Note { get; init; }
    public required DateTimeOffset CreatedAt { get; init; }
    public required DateTimeOffset UpdatedAt { get; init; }
    public DateTimeOffset? DeletedAt { get; init; }

    public static MedicationIntakeSyncDto FromEntity(MedicationIntake i) => new()
    {
        Id = i.Id,
        MedicationId = i.MedicationId,
        ScheduleId = i.ScheduleId,
        ScheduledFor = i.ScheduledFor,
        Status = i.Status,
        TakenAt = i.TakenAt,
        Note = i.Note,
        CreatedAt = i.CreatedAt,
        UpdatedAt = i.UpdatedAt,
        DeletedAt = i.DeletedAt,
    };
}

public sealed class RelapseLogEntrySyncDto : ISyncItem
{
    public required Guid Id { get; init; }
    public required string SymptomDescription { get; init; }
    public string? BodyArea { get; init; }
    public required DateOnly OnsetDate { get; init; }
    public required bool LastedOver24Hours { get; init; }
    public bool? HadFever { get; init; }
    public bool? HeatExposure { get; init; }
    public required RelapseGuidance GuidanceShown { get; init; }
    public bool ContactedMsTeam { get; init; }
    public DateOnly? ResolvedOn { get; init; }
    public string? Note { get; init; }
    public required DateTimeOffset CreatedAt { get; init; }
    public required DateTimeOffset UpdatedAt { get; init; }
    public DateTimeOffset? DeletedAt { get; init; }

    public static RelapseLogEntrySyncDto FromEntity(RelapseLogEntry e) => new()
    {
        Id = e.Id,
        SymptomDescription = e.SymptomDescription,
        BodyArea = e.BodyArea,
        OnsetDate = e.OnsetDate,
        LastedOver24Hours = e.LastedOver24Hours,
        HadFever = e.HadFever,
        HeatExposure = e.HeatExposure,
        GuidanceShown = e.GuidanceShown,
        ContactedMsTeam = e.ContactedMsTeam,
        ResolvedOn = e.ResolvedOn,
        Note = e.Note,
        CreatedAt = e.CreatedAt,
        UpdatedAt = e.UpdatedAt,
        DeletedAt = e.DeletedAt,
    };
}

public sealed class AppointmentSyncDto : ISyncItem
{
    public required Guid Id { get; init; }
    public required DateTimeOffset StartsAt { get; init; }
    public DateTimeOffset? EndsAt { get; init; }
    public AppointmentStatus Status { get; init; }
    public required AppointmentType Type { get; init; }
    public string? ClinicianName { get; init; }
    public string? Location { get; init; }
    public string? Note { get; init; }
    public required DateTimeOffset CreatedAt { get; init; }
    public required DateTimeOffset UpdatedAt { get; init; }
    public DateTimeOffset? DeletedAt { get; init; }

    public static AppointmentSyncDto FromEntity(Appointment a) => new()
    {
        Id = a.Id,
        StartsAt = a.StartsAt,
        EndsAt = a.EndsAt,
        Status = a.Status,
        Type = a.Type,
        ClinicianName = a.ClinicianName,
        Location = a.Location,
        Note = a.Note,
        CreatedAt = a.CreatedAt,
        UpdatedAt = a.UpdatedAt,
        DeletedAt = a.DeletedAt,
    };
}

public sealed class VisitQuestionSyncDto : ISyncItem
{
    public required Guid Id { get; init; }
    public Guid? AppointmentId { get; init; }
    public required string Text { get; init; }
    public bool Asked { get; init; }
    public string? AnswerNote { get; init; }
    public required DateTimeOffset CreatedAt { get; init; }
    public required DateTimeOffset UpdatedAt { get; init; }
    public DateTimeOffset? DeletedAt { get; init; }

    public static VisitQuestionSyncDto FromEntity(VisitQuestion q) => new()
    {
        Id = q.Id,
        AppointmentId = q.AppointmentId,
        Text = q.Text,
        Asked = q.Asked,
        AnswerNote = q.AnswerNote,
        CreatedAt = q.CreatedAt,
        UpdatedAt = q.UpdatedAt,
        DeletedAt = q.DeletedAt,
    };
}

public sealed class SideEffectSyncDto : ISyncItem
{
    public required Guid Id { get; init; }
    public Guid? MedicationId { get; init; }
    public required string Description { get; init; }
    public required SideEffectSeverity Severity { get; init; }
    public required DateOnly StartedOn { get; init; }
    public DateOnly? EndedOn { get; init; }
    public string? Note { get; init; }
    public required DateTimeOffset CreatedAt { get; init; }
    public required DateTimeOffset UpdatedAt { get; init; }
    public DateTimeOffset? DeletedAt { get; init; }

    public static SideEffectSyncDto FromEntity(SideEffect s) => new()
    {
        Id = s.Id,
        MedicationId = s.MedicationId,
        Description = s.Description,
        Severity = s.Severity,
        StartedOn = s.StartedOn,
        EndedOn = s.EndedOn,
        Note = s.Note,
        CreatedAt = s.CreatedAt,
        UpdatedAt = s.UpdatedAt,
        DeletedAt = s.DeletedAt,
    };
}
