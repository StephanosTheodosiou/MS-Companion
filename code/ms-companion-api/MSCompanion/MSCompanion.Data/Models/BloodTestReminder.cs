namespace MSCompanion.Data.Models;

/// <summary>A blood test the patient must remember (many DMTs require regular monitoring).</summary>
public class BloodTestReminder : PatientOwnedEntity
{
    public required string TestName { get; set; }

    public Guid? MedicationId { get; set; }

    public Medication? Medication { get; set; }

    public DateOnly DueDate { get; set; }

    /// <summary>Null = one-off. Otherwise a new reminder is created this many weeks after completion.</summary>
    public short? RepeatEveryWeeks { get; set; }

    public DateOnly? CompletedOn { get; set; }

    public bool ReminderEnabled { get; set; } = true;
}
