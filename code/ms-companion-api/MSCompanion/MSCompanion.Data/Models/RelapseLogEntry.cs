using MSCompanion.Domain.Enums;

namespace MSCompanion.Data.Models;

/// <summary>
/// A new or worsening symptom logged by the patient (E3, US-01).
///
/// This is a PATIENT-REPORTED record, not a confirmed relapse: the app never diagnoses.
/// FHIR: Observation (patient-reported), deliberately NOT Condition, because a Condition
/// would read as a diagnosis in the clinic's system.
/// </summary>
public class RelapseLogEntry : PatientOwnedEntity
{
    /// <summary>e.g. "numbness in left leg".</summary>
    public required string SymptomDescription { get; set; }

    public string? BodyArea { get; set; }

    public DateOnly OnsetDate { get; set; }

    // The answers that decide which guidance is shown (US-01 scenario 1).
    public bool LastedOver24Hours { get; set; }

    /// <summary>Null = patient did not answer.</summary>
    public bool? HadFever { get; set; }

    /// <summary>Null = patient did not answer.</summary>
    public bool? HeatExposure { get; set; }

    /// <summary>What the app told the patient. Kept as a record of the advice given.</summary>
    public RelapseGuidance GuidanceShown { get; set; }

    public bool ContactedMsTeam { get; set; }

    public DateOnly? ResolvedOn { get; set; }

    public string? Note { get; set; }
}
