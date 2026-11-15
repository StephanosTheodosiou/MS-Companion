using MSCompanion.Domain.Enums;

namespace MSCompanion.Data.Models;

/// <summary>A side effect the patient reports. FHIR: AdverseEvent (actuality = actual), patient-reported.</summary>
public class SideEffect : PatientOwnedEntity
{
    /// <summary>Optional: the patient may not know which medicine caused it.</summary>
    public Guid? MedicationId { get; set; }

    public Medication? Medication { get; set; }

    public required string Description { get; set; }

    public SideEffectSeverity Severity { get; set; }

    public DateOnly StartedOn { get; set; }

    public DateOnly? EndedOn { get; set; }

    public string? Note { get; set; }
}
