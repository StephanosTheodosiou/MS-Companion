using MSCompanion.Api.Dto;

namespace MSCompanion.Api.Interfaces;

public enum MedicationError
{
    PatientNotFound,
    ConsentRequired,
    NotFound,
    AlreadyLogged,
}

public readonly record struct MedicationResult<T>(T? Value, MedicationError? Error)
{
    public static implicit operator MedicationResult<T>(T value) => new(value, null);

    public static implicit operator MedicationResult<T>(MedicationError error) => new(default, error);
}

public interface IMedicationService
{
    Task<MedicationResult<List<MedicationDto>>> GetAllAsync(Guid userId, CancellationToken ct = default);

    Task<MedicationResult<MedicationDto>> GetAsync(Guid userId, Guid medicationId, CancellationToken ct = default);

    Task<MedicationResult<MedicationDto>> CreateAsync(Guid userId, SaveMedicationRequest request, CancellationToken ct = default);

    Task<MedicationResult<MedicationDto>> UpdateAsync(
        Guid userId,
        Guid medicationId,
        SaveMedicationRequest request,
        CancellationToken ct = default);

    Task<MedicationResult<bool>> DeleteAsync(Guid userId, Guid medicationId, CancellationToken ct = default);

    Task<MedicationResult<MedicationDto>> AddScheduleAsync(
        Guid userId,
        Guid medicationId,
        SaveScheduleRequest request,
        CancellationToken ct = default);

    Task<MedicationResult<MedicationDto>> UpdateScheduleAsync(
        Guid userId,
        Guid medicationId,
        Guid scheduleId,
        SaveScheduleRequest request,
        CancellationToken ct = default);

    Task<MedicationResult<MedicationDto>> DeleteScheduleAsync(
        Guid userId,
        Guid medicationId,
        Guid scheduleId,
        CancellationToken ct = default);

    Task<MedicationResult<MedicationIntakeDto>> LogIntakeAsync(
        Guid userId,
        Guid medicationId,
        LogIntakeRequest request,
        CancellationToken ct = default);

    Task<MedicationResult<bool>> DeleteIntakeAsync(
        Guid userId,
        Guid medicationId,
        Guid intakeId,
        CancellationToken ct = default);

    Task<MedicationResult<List<MedicationIntakeDto>>> GetIntakesAsync(
        Guid userId,
        DateTimeOffset from,
        DateTimeOffset to,
        CancellationToken ct = default);
}
