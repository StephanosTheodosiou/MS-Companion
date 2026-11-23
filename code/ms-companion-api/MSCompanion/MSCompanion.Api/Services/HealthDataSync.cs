using Microsoft.EntityFrameworkCore;
using MSCompanion.Api.Dto;
using MSCompanion.Data.Interfaces;
using MSCompanion.Data.Models;
using MSCompanion.Domain.Enums;
using MSCompanion.Domain.Rules;

namespace MSCompanion.Api.Services;

public sealed class HealthDataSync(ISyncRepository sync, TimeProvider clock, ILogger<HealthDataSync> logger)
{
    public Task<SyncRecordResult<MedicationSyncDto>> PushMedicationAsync(
        Guid patientId,
        MedicationSyncDto incoming,
        CancellationToken ct)
    {
        if (Validate(incoming) is { } problem)
        {
            return Task.FromResult(SyncRecordResult<MedicationSyncDto>.Rejected(incoming.Id, problem));
        }

        return UpsertAsync<Medication, MedicationSyncDto>(
            patientId,
            incoming,
            () => new Medication { Name = "" },
            async (target, source) =>
            {
                var deleting = target.DeletedAt is null && source.DeletedAt is not null;
                target.Name = source.Name.Trim();
                target.Dose = Clean(source.Dose);
                target.Instructions = Clean(source.Instructions);
                target.IsDiseaseModifying = source.IsDiseaseModifying;
                target.Status = source.Status;
                target.StartDate = source.StartDate;
                target.EndDate = source.EndDate;
                Stamp(target, source);

                if (deleting)
                {
                    foreach (var child in await sync.GetLiveMedicationChildrenAsync(target.Id, ct))
                    {
                        child.DeletedAt = target.DeletedAt;
                        child.UpdatedAt = target.UpdatedAt;
                    }
                }
            },
            rejectExisting: null,
            ct);
    }

    public async Task<SyncRecordResult<MedicationScheduleSyncDto>> PushScheduleAsync(
        Guid patientId,
        MedicationScheduleSyncDto incoming,
        CancellationToken ct)
    {
        if (Validate(incoming) is { } problem)
        {
            return SyncRecordResult<MedicationScheduleSyncDto>.Rejected(incoming.Id, problem);
        }

        if (!await OwnsMedicationAsync(patientId, incoming.MedicationId, ct))
        {
            return SyncRecordResult<MedicationScheduleSyncDto>.Rejected(incoming.Id, SyncReasons.UnknownMedication);
        }

        return await UpsertAsync<MedicationSchedule, MedicationScheduleSyncDto>(
            patientId,
            incoming,
            () => new MedicationSchedule { MedicationId = incoming.MedicationId },
            (target, source) =>
            {
                target.TimeOfDay = source.TimeOfDay;
                target.Days = WeekdaysMapper.ToFlags(source.Days);
                target.ReminderEnabled = source.ReminderEnabled;
                Stamp(target, source);
                return Task.CompletedTask;
            },
            existing => existing.MedicationId != incoming.MedicationId ? SyncReasons.MedicationChanged : null,
            ct);
    }

    public async Task<SyncRecordResult<MedicationIntakeSyncDto>> PushIntakeAsync(
        Guid patientId,
        MedicationIntakeSyncDto incoming,
        CancellationToken ct)
    {
        if (Validate(incoming) is { } problem)
        {
            return SyncRecordResult<MedicationIntakeSyncDto>.Rejected(incoming.Id, problem);
        }

        if (!await OwnsMedicationAsync(patientId, incoming.MedicationId, ct))
        {
            return SyncRecordResult<MedicationIntakeSyncDto>.Rejected(incoming.Id, SyncReasons.UnknownMedication);
        }

        if (incoming.ScheduleId is { } scheduleId)
        {
            var schedule = await sync.FindAsync<MedicationSchedule>(scheduleId, ct);
            if (schedule is null || schedule.PatientId != patientId || schedule.MedicationId != incoming.MedicationId)
            {
                return SyncRecordResult<MedicationIntakeSyncDto>.Rejected(incoming.Id, SyncReasons.UnknownSchedule);
            }

            if (incoming.DeletedAt is null
                && await sync.FindLiveIntakeForSlotAsync(scheduleId, incoming.ScheduledFor!.Value.ToUniversalTime(), ct)
                    is { } sameSlot
                && sameSlot.Id != incoming.Id)
            {
                if (incoming.UpdatedAt.ToUniversalTime() > sameSlot.UpdatedAt)
                {
                    ApplyIntake(sameSlot, incoming);
                }

                return await sync.TrySaveChangesAsync(ct)
                    ? SyncRecordResult<MedicationIntakeSyncDto>.Conflict(
                        incoming.Id, MedicationIntakeSyncDto.FromEntity(sameSlot))
                    : SyncRecordResult<MedicationIntakeSyncDto>.Rejected(incoming.Id, SyncReasons.RetryLater);
            }
        }

        return await UpsertAsync<MedicationIntake, MedicationIntakeSyncDto>(
            patientId,
            incoming,
            () => new MedicationIntake { MedicationId = incoming.MedicationId },
            (target, source) =>
            {
                target.ScheduleId = source.ScheduleId;
                target.ScheduledFor = source.ScheduledFor?.ToUniversalTime();
                ApplyIntake(target, source);
                return Task.CompletedTask;
            },
            existing => existing.MedicationId != incoming.MedicationId ? SyncReasons.MedicationChanged : null,
            ct);
    }

    public Task<SyncRecordResult<RelapseLogEntrySyncDto>> PushRelapseLogEntryAsync(
        Guid patientId,
        RelapseLogEntrySyncDto incoming,
        CancellationToken ct)
    {
        if (Validate(incoming) is { } problem)
        {
            return Task.FromResult(SyncRecordResult<RelapseLogEntrySyncDto>.Rejected(incoming.Id, problem));
        }

        return UpsertAsync<RelapseLogEntry, RelapseLogEntrySyncDto>(
            patientId,
            incoming,
            () => new RelapseLogEntry { SymptomDescription = "" },
            (target, source) =>
            {
                target.SymptomDescription = source.SymptomDescription.Trim();
                target.BodyArea = Clean(source.BodyArea);
                target.OnsetDate = source.OnsetDate;
                target.LastedOver24Hours = source.LastedOver24Hours;
                target.HadFever = source.HadFever;
                target.HeatExposure = source.HeatExposure;
                target.GuidanceShown = source.GuidanceShown;
                target.ContactedMsTeam = source.ContactedMsTeam;
                target.ResolvedOn = source.ResolvedOn;
                target.Note = Clean(source.Note);
                Stamp(target, source);
                return Task.CompletedTask;
            },
            rejectExisting: null,
            ct);
    }

    public Task<SyncRecordResult<AppointmentSyncDto>> PushAppointmentAsync(
        Guid patientId,
        AppointmentSyncDto incoming,
        CancellationToken ct)
    {
        if (Validate(incoming, clock.GetUtcNow()) is { } problem)
        {
            return Task.FromResult(SyncRecordResult<AppointmentSyncDto>.Rejected(incoming.Id, problem));
        }

        return UpsertAsync<Appointment, AppointmentSyncDto>(
            patientId,
            incoming,
            () => new Appointment(),
            async (target, source) =>
            {
                var deleting = target.DeletedAt is null && source.DeletedAt is not null;
                target.StartsAt = source.StartsAt.ToUniversalTime();
                target.EndsAt = source.EndsAt?.ToUniversalTime();
                target.Status = source.Status;
                target.Type = source.Type;
                target.ClinicianName = Clean(source.ClinicianName);
                target.Location = Clean(source.Location);
                target.Note = Clean(source.Note);
                Stamp(target, source);

                if (deleting)
                {
                    foreach (var question in await sync.GetLiveQuestionsForAppointmentAsync(target.Id, ct))
                    {
                        question.AppointmentId = null;
                        question.UpdatedAt = target.UpdatedAt;
                    }
                }
            },
            rejectExisting: null,
            ct);
    }

    public async Task<SyncRecordResult<VisitQuestionSyncDto>> PushVisitQuestionAsync(
        Guid patientId,
        VisitQuestionSyncDto incoming,
        CancellationToken ct)
    {
        if (Validate(incoming) is { } problem)
        {
            return SyncRecordResult<VisitQuestionSyncDto>.Rejected(incoming.Id, problem);
        }

        Guid? appointmentId = null;
        if (incoming.AppointmentId is { } id)
        {
            var appointment = await sync.FindAsync<Appointment>(id, ct);
            if (appointment is null || appointment.PatientId != patientId)
            {
                return SyncRecordResult<VisitQuestionSyncDto>.Rejected(incoming.Id, SyncReasons.UnknownAppointment);
            }

            appointmentId = appointment.DeletedAt is null ? appointment.Id : null;
        }

        return await UpsertAsync<VisitQuestion, VisitQuestionSyncDto>(
            patientId,
            incoming,
            () => new VisitQuestion { Text = "" },
            (target, source) =>
            {
                target.AppointmentId = appointmentId;
                target.Text = source.Text.Trim();
                target.Asked = source.Asked;
                target.AnswerNote = Clean(source.AnswerNote);
                Stamp(target, source);
                return Task.CompletedTask;
            },
            rejectExisting: null,
            ct);
    }

    private async Task<SyncRecordResult<TDto>> UpsertAsync<TEntity, TDto>(
        Guid patientId,
        TDto incoming,
        Func<TEntity> create,
        Func<TEntity, TDto, Task> apply,
        Func<TEntity, string?>? rejectExisting,
        CancellationToken ct)
        where TEntity : PatientOwnedEntity
        where TDto : class, ISyncItem
    {
        try
        {
            var existing = await sync.FindAsync<TEntity>(incoming.Id, ct);
            if (existing is not null && existing.PatientId != patientId)
            {
                return SyncRecordResult<TDto>.Rejected(incoming.Id, SyncReasons.NotFound);
            }

            if (existing is not null && rejectExisting?.Invoke(existing) is { } reason)
            {
                return SyncRecordResult<TDto>.Rejected(incoming.Id, reason);
            }

            if (existing is null)
            {
                var entity = create();
                entity.Id = incoming.Id;
                entity.PatientId = patientId;
                entity.CreatedAt = incoming.CreatedAt.ToUniversalTime();
                await apply(entity, incoming);
                sync.Add(entity);
            }
            else if (incoming.UpdatedAt.ToUniversalTime() > existing.UpdatedAt)
            {
                await apply(existing, incoming);
            }
            else
            {
                return SyncRecordResult<TDto>.Accepted(incoming.Id);
            }

            return await sync.TrySaveChangesAsync(ct)
                ? SyncRecordResult<TDto>.Accepted(incoming.Id)
                : SyncRecordResult<TDto>.Rejected(incoming.Id, SyncReasons.RetryLater);
        }
        catch (DbUpdateException ex)
        {
            logger.LogWarning(ex, "{Type} {Id} was rejected by the database", typeof(TEntity).Name, incoming.Id);
            sync.ClearTracking();
            return SyncRecordResult<TDto>.Rejected(incoming.Id, SyncReasons.Invalid);
        }
    }

    private async Task<bool> OwnsMedicationAsync(Guid patientId, Guid medicationId, CancellationToken ct) =>
        await sync.FindAsync<Medication>(medicationId, ct) is { } medication && medication.PatientId == patientId;

    private static void ApplyIntake(MedicationIntake target, MedicationIntakeSyncDto source)
    {
        target.Status = source.Status;
        target.TakenAt = source.TakenAt?.ToUniversalTime();
        target.Note = Clean(source.Note);
        Stamp(target, source);
    }

    private static void Stamp(PatientOwnedEntity target, ISyncItem source)
    {
        target.UpdatedAt = source.UpdatedAt.ToUniversalTime();
        target.DeletedAt = source.DeletedAt?.ToUniversalTime();
    }

    private static string? Validate(MedicationSyncDto m)
    {
        if (CommonProblem(m) is { } problem)
        {
            return problem;
        }

        return string.IsNullOrWhiteSpace(m.Name)
               || m.Name.Trim().Length > 200
               || m.Dose?.Trim().Length > 100
               || m.Instructions?.Trim().Length > 500
               || (m.StartDate is { } start && m.EndDate is { } end && end < start)
            ? SyncReasons.InvalidFields
            : null;
    }

    private static string? Validate(MedicationScheduleSyncDto s)
    {
        if (CommonProblem(s) is { } problem)
        {
            return problem;
        }

        return s.Days is null || s.Days.Count == 0 || s.Days.Distinct().Count() != s.Days.Count
            ? SyncReasons.InvalidFields
            : null;
    }

    private static string? Validate(MedicationIntakeSyncDto i)
    {
        if (CommonProblem(i) is { } problem)
        {
            return problem;
        }

        var scheduled = i.ScheduleId is not null;
        return scheduled != (i.ScheduledFor is not null)
               || (!scheduled && i.Status != IntakeStatus.Taken)
               || (i.Status == IntakeStatus.Taken) != (i.TakenAt is not null)
               || i.Note?.Trim().Length > 500
            ? SyncReasons.InvalidFields
            : null;
    }

    private static string? Validate(RelapseLogEntrySyncDto r)
    {
        if (CommonProblem(r) is { } problem)
        {
            return problem;
        }

        var latest = DateOnly.FromDateTime(DateTime.UtcNow).AddDays(1);
        if (string.IsNullOrWhiteSpace(r.SymptomDescription)
            || r.SymptomDescription.Trim().Length > 500
            || r.BodyArea?.Trim().Length > 100
            || r.Note?.Trim().Length > 1000
            || r.OnsetDate > latest
            || (r.ResolvedOn is { } resolved && (resolved < r.OnsetDate || resolved > latest)))
        {
            return SyncReasons.InvalidFields;
        }

        return r.GuidanceShown != RelapseGuidanceRule.For(r.LastedOver24Hours, r.HadFever, r.HeatExposure)
            ? SyncReasons.GuidanceMismatch
            : null;
    }

    private static string? Validate(AppointmentSyncDto a, DateTimeOffset now)
    {
        if (CommonProblem(a) is { } problem)
        {
            return problem;
        }

        return a.ClinicianName?.Trim().Length > AppointmentRules.ClinicianNameMaxLength
               || a.Location?.Trim().Length > AppointmentRules.LocationMaxLength
               || a.Note?.Trim().Length > AppointmentRules.NoteMaxLength
               || !AppointmentRules.HasRequiredEnd(a.Status, a.EndsAt)
               || !AppointmentRules.EndsAfterStart(a.StartsAt, a.EndsAt)
               || !AppointmentRules.StatusFitsTime(a.Status, a.StartsAt, now)
            ? SyncReasons.InvalidFields
            : null;
    }

    private static string? Validate(VisitQuestionSyncDto q)
    {
        if (CommonProblem(q) is { } problem)
        {
            return problem;
        }

        return string.IsNullOrWhiteSpace(q.Text)
               || q.Text.Trim().Length > VisitQuestionRules.TextMaxLength
               || q.AnswerNote?.Trim().Length > VisitQuestionRules.AnswerNoteMaxLength
               || !VisitQuestionRules.AnswerFitsAsked(q.Asked, q.AnswerNote)
            ? SyncReasons.InvalidFields
            : null;
    }

    private static string? CommonProblem(ISyncItem item)
    {
        if (item.Id == Guid.Empty)
        {
            return SyncReasons.Invalid;
        }

        return item.UpdatedAt < item.CreatedAt ? SyncReasons.InvalidTimestamps : null;
    }

    private static string? Clean(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
