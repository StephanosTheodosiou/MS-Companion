using MSCompanion.Api.Dto;
using MSCompanion.Api.Interfaces;
using MSCompanion.Data.Interfaces;
using MSCompanion.Data.Models;
using MSCompanion.Domain.Enums;

namespace MSCompanion.Api.Services;

public sealed class SideEffectService(
    IPatientRepository patients,
    ISideEffectRepository sideEffects,
    IConsentService consents,
    TimeProvider clock) : ISideEffectService
{
    public async Task<ServiceResult<List<SideEffectDto>>> GetAllAsync(
        Guid userId,
        Guid? medicationId,
        bool? ongoing,
        CancellationToken ct = default)
    {
        if (await patients.GetIdByUserIdAsync(userId, ct) is not { } patientId)
        {
            return ServiceError.PatientNotFound;
        }

        var list = await sideEffects.GetAllAsync(patientId, medicationId, ongoing, ct);
        return list.Select(SideEffectDto.FromEntity).ToList();
    }

    public async Task<ServiceResult<SideEffectDto>> GetAsync(Guid userId, Guid sideEffectId, CancellationToken ct = default)
    {
        if (await patients.GetIdByUserIdAsync(userId, ct) is not { } patientId)
        {
            return ServiceError.PatientNotFound;
        }

        var sideEffect = await sideEffects.GetAsync(patientId, sideEffectId, ct);
        return sideEffect is null ? ServiceError.NotFound : SideEffectDto.FromEntity(sideEffect);
    }

    public async Task<ServiceResult<SideEffectDto>> CreateAsync(
        Guid userId,
        SaveSideEffectRequest request,
        CancellationToken ct = default)
    {
        var (patientId, medication, error) = await PrepareWriteAsync(userId, request.MedicationId, ct);
        if (error is not null)
        {
            return error.Value;
        }

        var sideEffect = new SideEffect { Id = Guid.CreateVersion7(), PatientId = patientId, Description = "" };
        Apply(sideEffect, request, medication);
        sideEffects.Add(sideEffect);
        await sideEffects.SaveChangesAsync(ct);

        return SideEffectDto.FromEntity(sideEffect);
    }

    public async Task<ServiceResult<SideEffectDto>> UpdateAsync(
        Guid userId,
        Guid sideEffectId,
        SaveSideEffectRequest request,
        CancellationToken ct = default)
    {
        var (patientId, medication, error) = await PrepareWriteAsync(userId, request.MedicationId, ct);
        if (error is not null)
        {
            return error.Value;
        }

        if (await sideEffects.GetAsync(patientId, sideEffectId, ct) is not { } sideEffect)
        {
            return ServiceError.NotFound;
        }

        Apply(sideEffect, request, medication);
        sideEffect.UpdatedAt = clock.GetUtcNow();
        await sideEffects.SaveChangesAsync(ct);

        return SideEffectDto.FromEntity(sideEffect);
    }

    public async Task<ServiceResult<bool>> DeleteAsync(Guid userId, Guid sideEffectId, CancellationToken ct = default)
    {
        if (await patients.GetIdByUserIdAsync(userId, ct) is not { } patientId)
        {
            return ServiceError.PatientNotFound;
        }

        if (await sideEffects.GetAsync(patientId, sideEffectId, ct) is not { } sideEffect)
        {
            return ServiceError.NotFound;
        }

        var now = clock.GetUtcNow();
        sideEffect.DeletedAt = now;
        sideEffect.UpdatedAt = now;
        await sideEffects.SaveChangesAsync(ct);

        return true;
    }

    private async Task<(Guid PatientId, Medication? Medication, ServiceError? Error)> PrepareWriteAsync(
        Guid userId,
        Guid? medicationId,
        CancellationToken ct)
    {
        if (await patients.GetIdByUserIdAsync(userId, ct) is not { } patientId)
        {
            return (Guid.Empty, null, ServiceError.PatientNotFound);
        }

        if (!await consents.IsGrantedAsync(patientId, ConsentDataType.Medication, ct))
        {
            return (patientId, null, ServiceError.ConsentRequired);
        }

        if (medicationId is not { } id)
        {
            return (patientId, null, null);
        }

        var medication = await sideEffects.FindMedicationAsync(patientId, id, ct);
        return medication is null ? (patientId, null, ServiceError.NotFound) : (patientId, medication, null);
    }

    private static void Apply(SideEffect target, SaveSideEffectRequest source, Medication? medication)
    {
        target.MedicationId = medication?.Id;
        target.Medication = medication;
        target.Description = source.Description.Trim();
        target.Severity = source.Severity!.Value;
        target.StartedOn = source.StartedOn!.Value;
        target.EndedOn = source.EndedOn;
        target.Note = string.IsNullOrWhiteSpace(source.Note) ? null : source.Note.Trim();
    }
}
