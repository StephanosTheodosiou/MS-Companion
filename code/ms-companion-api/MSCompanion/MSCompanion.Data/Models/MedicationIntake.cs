using MSCompanion.Domain.Enums;

namespace MSCompanion.Data.Models;

/// <summary>
/// One answer to "did you take it?", the adherence log.
/// Summarised on the visit report (e.g. "taken 26 of 28 doses") rather than exported one by one.
/// </summary>
public class MedicationIntake : PatientOwnedEntity
{
    public Guid MedicationId { get; set; }

    public Medication Medication { get; set; } = null!;

    /// <summary>Null for an unscheduled ("as needed") dose.</summary>
    public Guid? ScheduleId { get; set; }

    public MedicationSchedule? Schedule { get; set; }

    /// <summary>The reminder slot this answers (UTC). Null for unscheduled doses.</summary>
    public DateTimeOffset? ScheduledFor { get; set; }

    public IntakeStatus Status { get; set; }

    public DateTimeOffset? TakenAt { get; set; }

    public string? Note { get; set; }
}
