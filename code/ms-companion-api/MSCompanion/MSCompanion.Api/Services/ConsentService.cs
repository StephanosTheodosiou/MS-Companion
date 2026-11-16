using MSCompanion.Api.Dto;
using MSCompanion.Api.Interfaces;
using MSCompanion.Data.Interfaces;
using MSCompanion.Data.Models;
using MSCompanion.Domain.Enums;

namespace MSCompanion.Api.Services;

public sealed class ConsentService(
    IPatientRepository patients,
    IConsentRepository consents,
    TimeProvider clock) : IConsentService
{
    public async Task<IReadOnlyList<ConsentStateDto>?> GetCurrentAsync(Guid userId, CancellationToken ct = default)
    {
        if (await patients.GetIdByUserIdAsync(userId, ct) is not { } patientId)
        {
            return null;
        }

        return ToStates(await consents.GetCurrentAsync(patientId, ct));
    }

    public async Task<IReadOnlyList<ConsentRecordDto>?> GetHistoryAsync(Guid userId, CancellationToken ct = default)
    {
        if (await patients.GetIdByUserIdAsync(userId, ct) is not { } patientId)
        {
            return null;
        }

        var history = await consents.GetHistoryAsync(patientId, ct);
        return history.Select(ConsentRecordDto.FromEntity).ToList();
    }

    public async Task<IReadOnlyList<ConsentStateDto>?> RecordAsync(
        Guid userId,
        RecordConsentRequest request,
        CancellationToken ct = default)
    {
        if (await patients.GetIdByUserIdAsync(userId, ct) is not { } patientId)
        {
            return null;
        }

        var current = await consents.GetCurrentAsync(patientId, ct);
        var policyVersion = request.PolicyVersion.Trim();
        var now = clock.GetUtcNow();

        // Only store real changes, so the history stays a clear record of decisions. Re-confirming the
        // same choice under a NEW policy version is a real decision (the patient agreed to new text).
        var newRecords = request.Decisions
            .Where(d => !current.TryGetValue(d.DataType!.Value, out var existing)
                        || existing.Granted != d.Granted!.Value
                        || existing.PolicyVersion != policyVersion)
            .Select(d => new ConsentRecord
            {
                Id = Guid.CreateVersion7(),
                PatientId = patientId,
                DataType = d.DataType!.Value,
                Granted = d.Granted!.Value,
                PolicyVersion = policyVersion,
                CreatedAt = now,
            })
            .ToList();

        if (newRecords.Count == 0)
        {
            return ToStates(current);
        }

        await consents.AddRangeAsync(newRecords, ct);

        var updated = current.ToDictionary(kv => kv.Key, kv => kv.Value);
        foreach (var record in newRecords)
        {
            updated[record.DataType] = record;
        }

        return ToStates(updated);
    }

    public async Task<bool> IsGrantedAsync(Guid patientId, ConsentDataType dataType, CancellationToken ct = default)
    {
        var current = await consents.GetCurrentAsync(patientId, ct);
        return current.TryGetValue(dataType, out var record) && record.Granted;
    }

    /// <summary>One entry for every data type, so the app can render all switches from a single call.</summary>
    private static List<ConsentStateDto> ToStates(IReadOnlyDictionary<ConsentDataType, ConsentRecord> current) =>
        Enum.GetValues<ConsentDataType>()
            .Select(type => current.TryGetValue(type, out var record)
                ? new ConsentStateDto
                {
                    DataType = type,
                    Granted = record.Granted,
                    PolicyVersion = record.PolicyVersion,
                    DecidedAt = record.CreatedAt,
                }
                : new ConsentStateDto { DataType = type, Granted = false })
            .ToList();
}
