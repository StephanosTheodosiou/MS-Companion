using MSCompanion.Data.Models;
using MSCompanion.Domain.Enums;

namespace MSCompanion.Data.Interfaces;

public interface IConsentRepository
{
    /// <summary>Every consent decision of the patient, newest first (the GDPR evidence trail).</summary>
    Task<IReadOnlyList<ConsentRecord>> GetHistoryAsync(Guid patientId, CancellationToken ct = default);

    /// <summary>The newest decision per data type. Types the patient never decided on are missing.</summary>
    Task<IReadOnlyDictionary<ConsentDataType, ConsentRecord>> GetCurrentAsync(
        Guid patientId,
        CancellationToken ct = default);

    /// <summary>Inserts new decisions. Consent records are append-only: existing rows are never changed.</summary>
    Task AddRangeAsync(IEnumerable<ConsentRecord> records, CancellationToken ct = default);
}
