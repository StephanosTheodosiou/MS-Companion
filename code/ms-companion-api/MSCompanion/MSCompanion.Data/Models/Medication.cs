using MSCompanion.Domain.Enums;

namespace MSCompanion.Data.Models;

/// <summary>
/// A medicine the patient takes (E3). FHIR: MedicationStatement.
/// Dose stays free text ("20 mg", "1 tablet"): the app records what the patient says and
/// never calculates or changes doses (treatment advice is out of scope).
/// </summary>
public class Medication : PatientOwnedEntity
{
    public required string Name { get; set; }

    public string? Dose { get; set; }

    public string? Instructions { get; set; }

    /// <summary>Disease-modifying therapy. Highlighted on the visit report and often linked to blood-test monitoring.</summary>
    public bool IsDiseaseModifying { get; set; }

    public MedicationStatus Status { get; set; } = MedicationStatus.Active;

    public DateOnly? StartDate { get; set; }

    public DateOnly? EndDate { get; set; }

    public ICollection<MedicationSchedule> Schedules { get; set; } = [];
    public ICollection<MedicationIntake> Intakes { get; set; } = [];
    public ICollection<SideEffect> SideEffects { get; set; } = [];
    public ICollection<BloodTestReminder> BloodTestReminders { get; set; } = [];
}
