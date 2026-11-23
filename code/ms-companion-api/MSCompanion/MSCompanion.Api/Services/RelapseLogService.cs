using MSCompanion.Api.Dto;
using MSCompanion.Api.Interfaces;
using MSCompanion.Data.Interfaces;
using MSCompanion.Data.Models;
using MSCompanion.Domain.Enums;

namespace MSCompanion.Api.Services;

public sealed class RelapseLogService(
    IPatientRepository patients,
    IRelapseLogRepository entries,
    IConsentService consents,
    TimeProvider clock) : IRelapseLogService
{
    public async Task<ServiceResult<List<RelapseLogEntryDto>>> GetAllAsync(Guid userId, CancellationToken ct = default)
    {
        if (await patients.GetIdByUserIdAsync(userId, ct) is not { } patientId)
        {
            return ServiceError.PatientNotFound;
        }

        var list = await entries.GetAllAsync(patientId, ct);
        return list.Select(RelapseLogEntryDto.FromEntity).ToList();
    }

    public async Task<ServiceResult<RelapseLogEntryDto>> GetAsync(Guid userId, Guid entryId, CancellationToken ct = default)
    {
        if (await patients.GetIdByUserIdAsync(userId, ct) is not { } patientId)
        {
            return ServiceError.PatientNotFound;
        }

        var entry = await entries.GetAsync(patientId, entryId, ct);
        return entry is null ? ServiceError.NotFound : RelapseLogEntryDto.FromEntity(entry);
    }

    public async Task<ServiceResult<RelapseLogEntryDto>> CreateAsync(
        Guid userId,
        SaveRelapseLogEntryRequest request,
        CancellationToken ct = default)
    {
        var (patientId, error) = await PatientForWriteAsync(userId, ct);
        if (error is not null)
        {
            return error.Value;
        }

        var entry = new RelapseLogEntry { Id = Guid.CreateVersion7(), PatientId = patientId, SymptomDescription = "" };
        Apply(entry, request);
        entries.Add(entry);
        await entries.SaveChangesAsync(ct);

        return RelapseLogEntryDto.FromEntity(entry);
    }

    public async Task<ServiceResult<RelapseLogEntryDto>> UpdateAsync(
        Guid userId,
        Guid entryId,
        SaveRelapseLogEntryRequest request,
        CancellationToken ct = default)
    {
        var (patientId, error) = await PatientForWriteAsync(userId, ct);
        if (error is not null)
        {
            return error.Value;
        }

        if (await entries.GetAsync(patientId, entryId, ct) is not { } entry)
        {
            return ServiceError.NotFound;
        }

        Apply(entry, request);
        entry.UpdatedAt = clock.GetUtcNow();
        await entries.SaveChangesAsync(ct);

        return RelapseLogEntryDto.FromEntity(entry);
    }

    public async Task<ServiceResult<bool>> DeleteAsync(Guid userId, Guid entryId, CancellationToken ct = default)
    {
        if (await patients.GetIdByUserIdAsync(userId, ct) is not { } patientId)
        {
            return ServiceError.PatientNotFound;
        }

        if (await entries.GetAsync(patientId, entryId, ct) is not { } entry)
        {
            return ServiceError.NotFound;
        }

        var now = clock.GetUtcNow();
        entry.DeletedAt = now;
        entry.UpdatedAt = now;
        await entries.SaveChangesAsync(ct);

        return true;
    }

    private async Task<(Guid PatientId, ServiceError? Error)> PatientForWriteAsync(Guid userId, CancellationToken ct)
    {
        if (await patients.GetIdByUserIdAsync(userId, ct) is not { } patientId)
        {
            return (Guid.Empty, ServiceError.PatientNotFound);
        }

        return await consents.IsGrantedAsync(patientId, ConsentDataType.SymptomCheckins, ct)
            ? (patientId, null)
            : (patientId, ServiceError.ConsentRequired);
    }

    private static void Apply(RelapseLogEntry target, SaveRelapseLogEntryRequest source)
    {
        target.SymptomDescription = source.SymptomDescription.Trim();
        target.BodyArea = Clean(source.BodyArea);
        target.OnsetDate = source.OnsetDate!.Value;
        target.LastedOver24Hours = source.LastedOver24Hours!.Value;
        target.HadFever = source.HadFever;
        target.HeatExposure = source.HeatExposure;
        target.GuidanceShown = source.GuidanceShown!.Value;
        target.ContactedMsTeam = source.ContactedMsTeam;
        target.ResolvedOn = source.ResolvedOn;
        target.Note = Clean(source.Note);
    }

    private static string? Clean(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
