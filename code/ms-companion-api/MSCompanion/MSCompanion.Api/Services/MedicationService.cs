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
    public async Task<MedicationResult<List<MedicationDto>>> GetAllAsync(Guid userId, CancellationToken ct = default)
    {
        if (await patients.GetIdByUserIdAsync(userId, ct) is not { } patientId)
        {
            return MedicationError.PatientNotFound;
        }

        var list = await medications.GetAllAsync(patientId, ct);
        return list.Select(MedicationDto.FromEntity).ToList();
    }

    public async Task<MedicationResult<MedicationDto>> GetAsync(Guid userId, Guid medicationId, CancellationToken ct = default)
    {
        if (await patients.GetIdByUserIdAsync(userId, ct) is not { } patientId)
        {
            return MedicationError.PatientNotFound;
        }

        var medication = await medications.GetAsync(patientId, medicationId, ct);
        return medication is null ? MedicationError.NotFound : MedicationDto.FromEntity(medication);
    }

    public async Task<MedicationResult<MedicationDto>> CreateAsync(
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

    public async Task<MedicationResult<MedicationDto>> UpdateAsync(
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
            return MedicationError.NotFound;
        }

        Apply(medication, request);
        medication.UpdatedAt = clock.GetUtcNow();
        await medications.TrySaveChangesAsync(ct);

        return MedicationDto.FromEntity(medication);
    }

    public async Task<MedicationResult<bool>> DeleteAsync(Guid userId, Guid medicationId, CancellationToken ct = default)
    {
        if (await patients.GetIdByUserIdAsync(userId, ct) is not { } patientId)
        {
            return MedicationError.PatientNotFound;
        }

        if (await medications.GetAsync(patientId, medicationId, ct) is not { } medication)
        {
            return MedicationError.NotFound;
        }

        var now = clock.GetUtcNow();
        IEnumerable<PatientOwnedEntity> rows = [medication, .. medication.Schedules, .. medication.Intakes];
        foreach (var row in rows)
        {
            row.DeletedAt = now;
            row.UpdatedAt = now;
        }

        await medications.TrySaveChangesAsync(ct);
        return true;
    }

    public async Task<MedicationResult<MedicationDto>> AddScheduleAsync(
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
            return MedicationError.NotFound;
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

    public async Task<MedicationResult<MedicationDto>> UpdateScheduleAsync(
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
            return MedicationError.NotFound;
        }

        Apply(schedule, request);
        schedule.UpdatedAt = clock.GetUtcNow();
        await medications.TrySaveChangesAsync(ct);

        return MedicationDto.FromEntity(medication);
    }

    public async Task<MedicationResult<MedicationDto>> DeleteScheduleAsync(
        Guid userId,
        Guid medicationId,
        Guid scheduleId,
        CancellationToken ct = default)
    {
        if (await patients.GetIdByUserIdAsync(userId, ct) is not { } patientId)
        {
            return MedicationError.PatientNotFound;
        }

        var medication = await medications.GetAsync(patientId, medicationId, ct);
        if (medication?.Schedules.FirstOrDefault(s => s.Id == scheduleId) is not { } schedule)
        {
            return MedicationError.NotFound;
        }

        var now = clock.GetUtcNow();
        schedule.DeletedAt = now;
        schedule.UpdatedAt = now;
        await medications.TrySaveChangesAsync(ct);

        return MedicationDto.FromEntity(medication);
    }

    public async Task<MedicationResult<MedicationIntakeDto>> LogIntakeAsync(
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
            return MedicationError.NotFound;
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
            : MedicationError.AlreadyLogged;
    }

    public async Task<MedicationResult<bool>> DeleteIntakeAsync(
        Guid userId,
        Guid medicationId,
        Guid intakeId,
        CancellationToken ct = default)
    {
        if (await patients.GetIdByUserIdAsync(userId, ct) is not { } patientId)
        {
            return MedicationError.PatientNotFound;
        }

        var medication = await medications.GetAsync(patientId, medicationId, ct);
        if (medication?.Intakes.FirstOrDefault(i => i.Id == intakeId) is not { } intake)
        {
            return MedicationError.NotFound;
        }

        var now = clock.GetUtcNow();
        intake.DeletedAt = now;
        intake.UpdatedAt = now;
        await medications.TrySaveChangesAsync(ct);

        return true;
    }

    public async Task<MedicationResult<List<MedicationIntakeDto>>> GetIntakesAsync(
        Guid userId,
        DateTimeOffset from,
        DateTimeOffset to,
        CancellationToken ct = default)
    {
        if (await patients.GetIdByUserIdAsync(userId, ct) is not { } patientId)
        {
            return MedicationError.PatientNotFound;
        }

        var intakes = await medications.GetIntakesAsync(patientId, from.ToUniversalTime(), to.ToUniversalTime(), ct);
        return intakes.Select(MedicationIntakeDto.FromEntity).ToList();
    }

    private async Task<(Guid PatientId, MedicationError? Error)> PatientForWriteAsync(Guid userId, CancellationToken ct)
    {
        if (await patients.GetIdByUserIdAsync(userId, ct) is not { } patientId)
        {
            return (Guid.Empty, MedicationError.PatientNotFound);
        }

        return await consents.IsGrantedAsync(patientId, ConsentDataType.Medication, ct)
            ? (patientId, null)
            : (patientId, MedicationError.ConsentRequired);
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
