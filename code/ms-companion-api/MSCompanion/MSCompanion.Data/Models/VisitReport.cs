namespace MSCompanion.Data.Models;

/// <summary>
/// A generated one-page summary (E7) and its FHIR export (E9), saved as an exact copy.
///
/// The relational tables are the source of truth. When a report is generated, the server builds an
/// R4 Bundle (type "document") from those tables and stores the JSON here. This keeps a record of exactly
/// what was sent to the clinic, even if the patient later edits a check-in. The only JSONB column in the schema.
///
/// Created on the server; the phone only pulls it.
/// </summary>
public class VisitReport : PatientOwnedEntity
{
    public Guid? AppointmentId { get; set; }

    public Appointment? Appointment { get; set; }

    /// <summary>Usually the day after the previous visit.</summary>
    public DateOnly PeriodStart { get; set; }

    public DateOnly PeriodEnd { get; set; }

    public DateTimeOffset GeneratedAt { get; set; }

    /// <summary>FHIR R4 Bundle JSON. Stored as jsonb.</summary>
    public required string FhirBundleJson { get; set; }

    public string FhirVersion { get; set; } = "4.0.1";
}
