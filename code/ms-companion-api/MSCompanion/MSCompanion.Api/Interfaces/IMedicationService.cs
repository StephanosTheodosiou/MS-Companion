using MSCompanion.Api.Dto;

namespace MSCompanion.Api.Interfaces;

public interface IMedicationService
{
    Task<ServiceResult<List<MedicationDto>>> GetAllAsync(Guid userId, CancellationToken ct = default);

    Task<ServiceResult<MedicationDto>> GetAsync(Guid userId, Guid medicationId, CancellationToken ct = default);

    Task<ServiceResult<MedicationDto>> CreateAsync(Guid userId, SaveMedicationRequest request, CancellationToken ct = default);

    Task<ServiceResult<MedicationDto>> UpdateAsync(
        Guid userId,
        Guid medicationId,
        SaveMedicationRequest request,
        CancellationToken ct = default);

    Task<ServiceResult<bool>> DeleteAsync(Guid userId, Guid medicationId, CancellationToken ct = default);

    Task<ServiceResult<MedicationDto>> AddScheduleAsync(
        Guid userId,
        Guid medicationId,
        SaveScheduleRequest request,
        CancellationToken ct = default);

    Task<ServiceResult<MedicationDto>> UpdateScheduleAsync(
        Guid userId,
        Guid medicationId,
        Guid scheduleId,
        SaveScheduleRequest request,
        CancellationToken ct = default);

    Task<ServiceResult<MedicationDto>> DeleteScheduleAsync(
        Guid userId,
        Guid medicationId,
        Guid scheduleId,
        CancellationToken ct = default);

    Task<ServiceResult<MedicationIntakeDto>> LogIntakeAsync(
        Guid userId,
        Guid medicationId,
        LogIntakeRequest request,
        CancellationToken ct = default);

    Task<ServiceResult<bool>> DeleteIntakeAsync(
        Guid userId,
        Guid medicationId,
        Guid intakeId,
        CancellationToken ct = default);

    Task<ServiceResult<List<MedicationIntakeDto>>> GetIntakesAsync(
        Guid userId,
        DateTimeOffset from,
        DateTimeOffset to,
        CancellationToken ct = default);
}
