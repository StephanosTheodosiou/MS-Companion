using MSCompanion.Api.Dto;
using MSCompanion.Api.Interfaces;
using MSCompanion.Data.Interfaces;
using MSCompanion.Data.Models;
using MSCompanion.Domain.Enums;
using MSCompanion.Domain.Rules;

namespace MSCompanion.Api.Services;

public sealed class BloodTestService(
    IPatientRepository patients,
    IBloodTestRepository reminders,
    IConsentService consents,
    TimeProvider clock) : IBloodTestService
{
    public async Task<ServiceResult<List<BloodTestDto>>> GetAllAsync(
        Guid userId,
        BloodTestStatus? status,
        Guid? medicationId,
        CancellationToken ct = default)
    {
        if (await patients.GetByUserIdAsync(userId, ct) is not { } patient)
        {
            return ServiceError.PatientNotFound;
        }

        var today = Today(patient);
        var list = await reminders.GetAllAsync(patient.Id, medicationId, ct);
        return list
            .Where(r => status is null || BloodTestDto.StatusOf(r, today) == status)
            .Select(r => BloodTestDto.FromEntity(r, today))
            .ToList();
    }

    public async Task<ServiceResult<BloodTestDto>> GetAsync(Guid userId, Guid reminderId, CancellationToken ct = default)
    {
        if (await patients.GetByUserIdAsync(userId, ct) is not { } patient)
        {
            return ServiceError.PatientNotFound;
        }

        var reminder = await reminders.GetAsync(patient.Id, reminderId, ct);
        return reminder is null ? ServiceError.NotFound : BloodTestDto.FromEntity(reminder, Today(patient));
    }

    public async Task<ServiceResult<BloodTestDto>> CreateAsync(
        Guid userId,
        SaveBloodTestRequest request,
        CancellationToken ct = default)
    {
        var (patient, medication, error) = await PrepareWriteAsync(userId, request.MedicationId, ct);
        if (error is not null)
        {
            return error.Value;
        }

        var reminder = new BloodTestReminder { Id = Guid.CreateVersion7(), PatientId = patient!.Id, TestName = "" };
        Apply(reminder, request, medication);
        reminders.Add(reminder);
        await reminders.SaveChangesAsync(ct);

        return BloodTestDto.FromEntity(reminder, Today(patient));
    }

    public async Task<ServiceResult<BloodTestDto>> UpdateAsync(
        Guid userId,
        Guid reminderId,
        SaveBloodTestRequest request,
        CancellationToken ct = default)
    {
        var (patient, medication, error) = await PrepareWriteAsync(userId, request.MedicationId, ct);
        if (error is not null)
        {
            return error.Value;
        }

        if (await reminders.GetAsync(patient!.Id, reminderId, ct) is not { } reminder)
        {
            return ServiceError.NotFound;
        }

        Apply(reminder, request, medication);
        reminder.UpdatedAt = clock.GetUtcNow();
        await reminders.SaveChangesAsync(ct);

        return BloodTestDto.FromEntity(reminder, Today(patient));
    }

    public async Task<ServiceResult<CompleteBloodTestResponse>> CompleteAsync(
        Guid userId,
        Guid reminderId,
        CompleteBloodTestRequest request,
        CancellationToken ct = default)
    {
        var (patient, _, error) = await PrepareWriteAsync(userId, null, ct);
        if (error is not null)
        {
            return error.Value;
        }

        if (await reminders.GetAsync(patient!.Id, reminderId, ct) is not { } reminder)
        {
            return ServiceError.NotFound;
        }

        if (reminder.CompletedOn is not null)
        {
            return ServiceError.AlreadyCompleted;
        }

        var today = Today(patient);
        var completedOn = request.CompletedOn!.Value;
        if (completedOn > today)
        {
            return ServiceError.DateInFuture;
        }

        reminder.CompletedOn = completedOn;
        reminder.UpdatedAt = clock.GetUtcNow();

        BloodTestReminder? next = null;
        if (reminder.RepeatEveryWeeks is { } weeks)
        {
            next = new BloodTestReminder
            {
                Id = Guid.CreateVersion7(),
                PatientId = patient.Id,
                TestName = reminder.TestName,
                MedicationId = reminder.MedicationId,
                Medication = reminder.Medication,
                DueDate = BloodTestRules.NextDueDate(completedOn, weeks),
                RepeatEveryWeeks = weeks,
                ReminderEnabled = reminder.ReminderEnabled,
            };
            reminders.Add(next);
        }

        await reminders.SaveChangesAsync(ct);

        return new CompleteBloodTestResponse
        {
            Completed = BloodTestDto.FromEntity(reminder, today),
            Next = next is null ? null : BloodTestDto.FromEntity(next, today),
        };
    }

    public async Task<ServiceResult<bool>> DeleteAsync(Guid userId, Guid reminderId, CancellationToken ct = default)
    {
        if (await patients.GetIdByUserIdAsync(userId, ct) is not { } patientId)
        {
            return ServiceError.PatientNotFound;
        }

        if (await reminders.GetAsync(patientId, reminderId, ct) is not { } reminder)
        {
            return ServiceError.NotFound;
        }

        var now = clock.GetUtcNow();
        reminder.DeletedAt = now;
        reminder.UpdatedAt = now;
        await reminders.SaveChangesAsync(ct);

        return true;
    }

    private async Task<(Patient? Patient, Medication? Medication, ServiceError? Error)> PrepareWriteAsync(
        Guid userId,
        Guid? medicationId,
        CancellationToken ct)
    {
        if (await patients.GetByUserIdAsync(userId, ct) is not { } patient)
        {
            return (null, null, ServiceError.PatientNotFound);
        }

        if (!await consents.IsGrantedAsync(patient.Id, ConsentDataType.Medication, ct))
        {
            return (patient, null, ServiceError.ConsentRequired);
        }

        if (medicationId is not { } id)
        {
            return (patient, null, null);
        }

        var medication = await reminders.FindMedicationAsync(patient.Id, id, ct);
        return medication is null ? (patient, null, ServiceError.NotFound) : (patient, medication, null);
    }

    private DateOnly Today(Patient patient)
    {
        var zone = TimeZoneInfo.TryFindSystemTimeZoneById(patient.TimeZone, out var found) ? found : TimeZoneInfo.Utc;
        return DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(clock.GetUtcNow(), zone).DateTime);
    }

    private static void Apply(BloodTestReminder target, SaveBloodTestRequest source, Medication? medication)
    {
        target.TestName = source.TestName.Trim();
        target.MedicationId = medication?.Id;
        target.Medication = medication;
        target.DueDate = source.DueDate!.Value;
        target.RepeatEveryWeeks = source.RepeatEveryWeeks;
        target.ReminderEnabled = source.ReminderEnabled;
    }
}
