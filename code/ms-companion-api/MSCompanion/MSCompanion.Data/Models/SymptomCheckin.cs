using MSCompanion.Domain.Enums;

namespace MSCompanion.Data.Models;

/// <summary>
/// Daily check-in (E2). One live row per patient per day.
/// FHIR: Observation (category "survey") with one component per symptom.
/// Kept "wide" (six columns) rather than one row per symptom: the set of questions is fixed,
/// it matches the screens one-to-one and makes trend queries simple.
/// </summary>
public class SymptomCheckin : PatientOwnedEntity
{
    /// <summary>The patient's local calendar day (see <see cref="Patient.TimeZone"/>), not a UTC date.</summary>
    public DateOnly CheckinDate { get; set; }

    public SymptomScore Fatigue { get; set; }
    public SymptomScore Mobility { get; set; }
    public SymptomScore Pain { get; set; }
    public SymptomScore Mood { get; set; }
    public SymptomScore Cognition { get; set; }
    public SymptomScore Bladder { get; set; }

    public string? Note { get; set; }

    /// <summary>True if a low mood score showed the support prompt. Keeps a record of what the app did.</summary>
    public bool LowMoodPromptShown { get; set; }
}
