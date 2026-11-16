using MSCompanion.Domain.Enums;

namespace MSCompanion.Data.Models;

/// <summary>
/// One consent decision. FHIR: Consent.
///
/// APPEND-ONLY: a row is never updated. Granting or withdrawing consent adds a new row, so the full history
/// (who agreed to what, when, under which policy text) is kept as GDPR evidence (Art. 7).
/// The current state for a data type is the row with the latest <see cref="SyncedEntity.CreatedAt"/>.
/// <see cref="AppDbContext"/> throws if code tries to modify an existing row.
/// </summary>
public class ConsentRecord : SyncedEntity, IPatientOwned
{
    public Guid PatientId { get; set; }

    public Patient Patient { get; set; } = null!;

    public ConsentDataType DataType { get; set; }

    public bool Granted { get; set; }

    /// <summary>Version of the consent text the patient saw, e.g. "2026-10-v1".</summary>
    public required string PolicyVersion { get; set; }

    // CreatedAt (from SyncedEntity) = the moment the decision was made on the phone.
}
