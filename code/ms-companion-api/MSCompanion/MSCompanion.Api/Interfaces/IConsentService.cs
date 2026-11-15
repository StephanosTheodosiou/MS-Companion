using MSCompanion.Api.Dto;
using MSCompanion.Domain.Enums;

namespace MSCompanion.Api.Interfaces;

public interface IConsentService
{
    /// <returns>One entry per data type, or null if the user has no patient record.</returns>
    Task<IReadOnlyList<ConsentStateDto>?> GetCurrentAsync(Guid userId, CancellationToken ct = default);

    /// <returns>All past decisions, newest first, or null if the user has no patient record.</returns>
    Task<IReadOnlyList<ConsentRecordDto>?> GetHistoryAsync(Guid userId, CancellationToken ct = default);

    /// <summary>Stores the decisions that differ from the current state (or use a new policy version).</summary>
    /// <returns>The current state after saving, or null if the user has no patient record.</returns>
    Task<IReadOnlyList<ConsentStateDto>?> RecordAsync(
        Guid userId,
        RecordConsentRequest request,
        CancellationToken ct = default);

    /// <summary>For other features: has the patient currently granted consent for this data type?</summary>
    Task<bool> IsGrantedAsync(Guid patientId, ConsentDataType dataType, CancellationToken ct = default);
}
