using MSCompanion.Api.Dto;
using MSCompanion.Api.Interfaces;
using MSCompanion.Data.Interfaces;
using MSCompanion.Data.Models;
using MSCompanion.Domain.Enums;

namespace MSCompanion.Api.Services;

public sealed class MedicationService(
    IPatientRepository patients,
    IMedicationRepository medications,
    IConsentService consents,
    TimeProvider clock) : IMedicationService
{
    public async Task<ServiceResult<List<MedicationDto>>> GetAllAsync(Guid userId, CancellationToken ct = default)
    {
        if (await patients.GetIdByUserIdAsync(userId, ct) is not { } patientId)
        {
            return ServiceError.PatientNotFound;
        }

        var list = await medications.GetAllAsync(patientId, ct);
        return list.Select(MedicationDto.FromEntity).ToList();
    }

    public async Task<ServiceResult<MedicationDto>> GetAsync(Guid userId, Guid medicationId, CancellationToken ct = default)
    {
        if (await patients.GetIdByUserIdAsync(userId, ct) is not { } patientId)
        {
            return ServiceError.PatientNotFound;
        }

        var medication = await medications.GetAsync(patientId, medicationId, ct);
        return medication is null ? ServiceError.NotFound : MedicationDto.FromEntity(medication);
    }

    public async Task<ServiceResult<MedicationDto>> CreateAsync(
        Guid userId,
        SaveMedicationRequest request,
        CancellationToken ct = default)
    {
        var (patientId, error) = await PatientForWriteAsync(userId, ct);
        if (error is not null)
        {
            return error.Value;
        }

        var medication = new Medication { Id = Guid.CreateVersion7(), PatientId = patientId, Name = "" };
        Apply(medication, request);
        medications.Add(medication);
        await medications.TrySaveChangesAsync(ct);

        return MedicationDto.FromEntity(medication);
    }

    public async Task<ServiceResult<MedicationDto>> UpdateAsync(
        Guid userId,
        Guid medicationId,
        SaveMedicationRequest request,
        CancellationToken ct = default)
    {
        var (patientId, error) = await PatientForWriteAsync(userId, ct);
        if (error is not null)
        {
            return error.Value;
        }

        if (await medications.GetAsync(patientId, medicationId, ct) is not { } medication)
        {
            return ServiceError.NotFound;
        }

        Apply(medication, request);
        medication.UpdatedAt = clock.GetUtcNow();
        await medications.TrySaveChangesAsync(ct);

        return MedicationDto.FromEntity(medication);
    }

    public async Task<ServiceResult<bool>> DeleteAsync(Guid userId, Guid medicationId, CancellationToken ct = default)
    {
        if (await patients.GetIdByUserIdAsync(userId, ct) is not { } patientId)
        {
            return ServiceError.PatientNotFound;
        }

        if (await medications.GetAsync(patientId, medicationId, ct) is not { } medication)
        {
            return ServiceError.NotFound;
        }

        var now = clock.GetUtcNow();
        IEnumerable<PatientOwnedEntity> rows =
            [medication, .. medication.Schedules, .. medication.Intakes, .. medication.BloodTestReminders];
        foreach (var row in rows)
        {
            row.DeletedAt = now;
            row.UpdatedAt = now;
        }

        await medications.TrySaveChangesAsync(ct);
        return true;
    }

    public async Task<ServiceResult<MedicationDto>> AddScheduleAsync(
        Guid userId,
        Guid medicationId,
        SaveScheduleRequest request,
        CancellationToken ct = default)
    {
        var (patientId, error) = await PatientForWriteAsync(userId, ct);
        if (error is not null)
        {
            return error.Value;
        }

        if (await medications.GetAsync(patientId, medicationId, ct) is not { } medication)
        {
            return ServiceError.NotFound;
        }

        var schedule = new MedicationSchedule
        {
            Id = Guid.CreateVersion7(),
            PatientId = patientId,
            MedicationId = medication.Id,
        };
        Apply(schedule, request);
        medications.Add(schedule);
        await medications.TrySaveChangesAsync(ct);

        return MedicationDto.FromEntity(medication);
    }

    public async Task<ServiceResult<MedicationDto>> UpdateScheduleAsync(
        Guid userId,
        Guid medicationId,
        Guid scheduleId,
        SaveScheduleRequest request,
        CancellationToken ct = default)
    {
        var (patientId, error) = await PatientForWriteAsync(userId, ct);
        if (error is not null)
        {
            return error.Value;
        }

        var medication = await medications.GetAsync(patientId, medicationId, ct);
        if (medication?.Schedules.FirstOrDefault(s => s.Id == scheduleId) is not { } schedule)
        {
            return ServiceError.NotFound;
        }

        Apply(schedule, request);
        schedule.UpdatedAt = clock.GetUtcNow();
        await medications.TrySaveChangesAsync(ct);

        return MedicationDto.FromEntity(medication);
    }

    public async Task<ServiceResult<MedicationDto>> DeleteScheduleAsync(
        Guid userId,
        Guid medicationId,
        Guid scheduleId,
        CancellationToken ct = default)
    {
        if (await patients.GetIdByUserIdAsync(userId, ct) is not { } patientId)
        {
            return ServiceError.PatientNotFound;
        }

        var medication = await medications.GetAsync(patientId, medicationId, ct);
        if (medication?.Schedules.FirstOrDefault(s => s.Id == scheduleId) is not { } schedule)
        {
            return ServiceError.NotFound;
        }

        var now = clock.GetUtcNow();
        schedule.DeletedAt = now;
        schedule.UpdatedAt = now;
        await medications.TrySaveChangesAsync(ct);

        return MedicationDto.FromEntity(medication);
    }

    public async Task<ServiceResult<MedicationIntakeDto>> LogIntakeAsync(
        Guid userId,
        Guid medicationId,
        LogIntakeRequest request,
        CancellationToken ct = default)
    {
        var (patientId, error) = await PatientForWriteAsync(userId, ct);
        if (error is not null)
        {
            return error.Value;
        }

        var medication = await medications.GetAsync(patientId, medicationId, ct);
        if (medication is null
            || (request.ScheduleId is { } scheduleId && medication.Schedules.All(s => s.Id != scheduleId)))
        {
            return ServiceError.NotFound;
        }

        var status = request.Status!.Value;
        var intake = new MedicationIntake
        {
            Id = Guid.CreateVersion7(),
            PatientId = patientId,
            MedicationId = medication.Id,
            ScheduleId = request.ScheduleId,
            ScheduledFor = request.ScheduledFor?.ToUniversalTime(),
            Status = status,
            TakenAt = status == IntakeStatus.Taken
                ? (request.TakenAt ?? clock.GetUtcNow()).ToUniversalTime()
                : null,
            Note = Clean(request.Note),
        };
        medications.Add(intake);

        return await medications.TrySaveChangesAsync(ct)
            ? MedicationIntakeDto.FromEntity(intake)
            : ServiceError.AlreadyLogged;
    }

    public async Task<ServiceResult<bool>> DeleteIntakeAsync(
        Guid userId,
        Guid medicationId,
        Guid intakeId,
        CancellationToken ct = default)
    {
        if (await patients.GetIdByUserIdAsync(userId, ct) is not { } patientId)
        {
            return ServiceError.PatientNotFound;
        }

        var medication = await medications.GetAsync(patientId, medicationId, ct);
        if (medication?.Intakes.FirstOrDefault(i => i.Id == intakeId) is not { } intake)
        {
            return ServiceError.NotFound;
        }

        var now = clock.GetUtcNow();
        intake.DeletedAt = now;
        intake.UpdatedAt = now;
        await medications.TrySaveChangesAsync(ct);

        return true;
    }

    public async Task<ServiceResult<List<MedicationIntakeDto>>> GetIntakesAsync(
        Guid userId,
        DateTimeOffset from,
        DateTimeOffset to,
        CancellationToken ct = default)
    {
        if (await patients.GetIdByUserIdAsync(userId, ct) is not { } patientId)
        {
            return ServiceError.PatientNotFound;
        }

        var intakes = await medications.GetIntakesAsync(patientId, from.ToUniversalTime(), to.ToUniversalTime(), ct);
        return intakes.Select(MedicationIntakeDto.FromEntity).ToList();
    }

    private async Task<(Guid PatientId, ServiceError? Error)> PatientForWriteAsync(Guid userId, CancellationToken ct)
    {
        if (await patients.GetIdByUserIdAsync(userId, ct) is not { } patientId)
        {
            return (Guid.Empty, ServiceError.PatientNotFound);
        }

        return await consents.IsGrantedAsync(patientId, ConsentDataType.Medication, ct)
            ? (patientId, null)
            : (patientId, ServiceError.ConsentRequired);
    }

    private static void Apply(Medication target, SaveMedicationRequest source)
    {
        target.Name = source.Name.Trim();
        target.Dose = Clean(source.Dose);
        target.Instructions = Clean(source.Instructions);
        target.IsDiseaseModifying = source.IsDiseaseModifying;
        target.Status = source.Status;
        target.StartDate = source.StartDate;
        target.EndDate = source.EndDate;
    }

    private static void Apply(MedicationSchedule target, SaveScheduleRequest source)
    {
        target.TimeOfDay = source.TimeOfDay!.Value;
        target.Days = WeekdaysMapper.ToFlags(source.Days);
        target.ReminderEnabled = source.ReminderEnabled;
    }

    private static string? Clean(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
