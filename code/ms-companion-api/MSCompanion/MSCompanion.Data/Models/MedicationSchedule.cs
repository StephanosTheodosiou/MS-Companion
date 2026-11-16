using MSCompanion.Domain.Enums;

namespace MSCompanion.Data.Models;

/// <summary>
/// When a medicine should be taken, which drives the reminders.
/// One row per time of day; "twice daily" = two rows. Weekly or three-times-weekly injections use the
/// <see cref="Days"/> bit mask. Infusions every few months are Appointments, not schedules.
/// Soft-deleting a Medication must also soft-delete its schedules (service layer).
/// </summary>
public class MedicationSchedule : PatientOwnedEntity
{
    public Guid MedicationId { get; set; }

    public Medication Medication { get; set; } = null!;

    /// <summary>Local time of day in the patient's time zone.</summary>
    public TimeOnly TimeOfDay { get; set; }

    public Weekdays Days { get; set; } = Weekdays.EveryDay;

    public bool ReminderEnabled { get; set; } = true;

    public ICollection<MedicationIntake> Intakes { get; set; } = [];
}
