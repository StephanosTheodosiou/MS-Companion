using Microsoft.EntityFrameworkCore;
using MSCompanion.Api.Dto;
using MSCompanion.Api.Interfaces;
using MSCompanion.Data.Interfaces;
using MSCompanion.Data.Models;
using MSCompanion.Domain.Enums;
using MSCompanion.Domain.Fhir;

namespace MSCompanion.Api.Services;

public sealed class SyncService(
    IPatientRepository patients,
    ISyncRepository sync,
    IConsentService consents,
    HealthDataSync healthData,
    TimeProvider clock,
    ILogger<SyncService> logger) : ISyncService
{
    private static readonly TimeSpan SettleDelay = TimeSpan.FromSeconds(5);
    private const int MaxNoteLength = 1000;
    private const int MaxTimeZoneLength = 64;

    public async Task<SyncPushResponse?> PushAsync(Guid userId, SyncPushRequest request, CancellationToken ct = default)
    {
        if (await patients.GetIdByUserIdAsync(userId, ct) is not { } patientId)
        {
            return null;
        }

        var response = new SyncPushResponse();
        if (request.IsEmpty())
        {
            return response;
        }

        var symptomsAllowed = await consents.IsGrantedAsync(patientId, ConsentDataType.SymptomCheckins, ct);
        var medicationAllowed = await consents.IsGrantedAsync(patientId, ConsentDataType.Medication, ct);

        await using var transaction = await sync.BeginTransactionAsync(ct);

        foreach (var incoming in request.CheckIns)
        {
            response.CheckIns.Add(symptomsAllowed
                ? await PushCheckInAsync(patientId, incoming, ct)
                : Rejected(incoming.Id, SyncReasons.ConsentRequired));
        }

        foreach (var incoming in request.Medications)
        {
            response.Medications.Add(medicationAllowed
                ? await healthData.PushMedicationAsync(patientId, incoming, ct)
                : SyncRecordResult<MedicationSyncDto>.Rejected(incoming.Id, SyncReasons.ConsentRequired));
        }

        foreach (var incoming in request.MedicationSchedules)
        {
            response.MedicationSchedules.Add(medicationAllowed
                ? await healthData.PushScheduleAsync(patientId, incoming, ct)
                : SyncRecordResult<MedicationScheduleSyncDto>.Rejected(incoming.Id, SyncReasons.ConsentRequired));
        }

        foreach (var incoming in request.MedicationIntakes)
        {
            response.MedicationIntakes.Add(medicationAllowed
                ? await healthData.PushIntakeAsync(patientId, incoming, ct)
                : SyncRecordResult<MedicationIntakeSyncDto>.Rejected(incoming.Id, SyncReasons.ConsentRequired));
        }

        foreach (var incoming in request.RelapseLogEntries)
        {
            response.RelapseLogEntries.Add(symptomsAllowed
                ? await healthData.PushRelapseLogEntryAsync(patientId, incoming, ct)
                : SyncRecordResult<RelapseLogEntrySyncDto>.Rejected(incoming.Id, SyncReasons.ConsentRequired));
        }

        foreach (var incoming in request.Appointments)
        {
            response.Appointments.Add(symptomsAllowed
                ? await healthData.PushAppointmentAsync(patientId, incoming, ct)
                : SyncRecordResult<AppointmentSyncDto>.Rejected(incoming.Id, SyncReasons.ConsentRequired));
        }

        foreach (var incoming in request.VisitQuestions)
        {
            response.VisitQuestions.Add(symptomsAllowed
                ? await healthData.PushVisitQuestionAsync(patientId, incoming, ct)
                : SyncRecordResult<VisitQuestionSyncDto>.Rejected(incoming.Id, SyncReasons.ConsentRequired));
        }

        await transaction.CommitAsync(ct);
        return response;
    }

    public async Task<SyncPullResponse?> PullAsync(Guid userId, SyncCursorSet after, int limit, CancellationToken ct = default)
    {
        if (await patients.GetIdByUserIdAsync(userId, ct) is not { } patientId)
        {
            return null;
        }

        var settled = clock.GetUtcNow() - SettleDelay;

        var checkInCursor = after[SyncType.CheckIns];
        var checkIns = Page(
            await sync.GetCheckInsChangedAsync(
                patientId, checkInCursor?.ServerUpdatedAt, checkInCursor?.Id ?? Guid.Empty, settled, limit + 1, ct),
            limit,
            checkInCursor);
        var medications = await ChangedPage<Medication>(SyncType.Medications);
        var schedules = await ChangedPage<MedicationSchedule>(SyncType.MedicationSchedules);
        var intakes = await ChangedPage<MedicationIntake>(SyncType.MedicationIntakes);
        var relapses = await ChangedPage<RelapseLogEntry>(SyncType.RelapseLogEntries);
        var appointments = await ChangedPage<Appointment>(SyncType.Appointments);
        var questions = await ChangedPage<VisitQuestion>(SyncType.VisitQuestions);

        var next = SyncCursorSet.From(new Dictionary<SyncType, SyncCursor?>
        {
            [SyncType.CheckIns] = checkIns.Next,
            [SyncType.Medications] = medications.Next,
            [SyncType.MedicationSchedules] = schedules.Next,
            [SyncType.MedicationIntakes] = intakes.Next,
            [SyncType.RelapseLogEntries] = relapses.Next,
            [SyncType.Appointments] = appointments.Next,
            [SyncType.VisitQuestions] = questions.Next,
        });

        return new SyncPullResponse
        {
            CheckIns = checkIns.Rows.Select(CheckInSyncDto.FromEntity).ToList(),
            Medications = medications.Rows.Select(MedicationSyncDto.FromEntity).ToList(),
            MedicationSchedules = schedules.Rows.Select(MedicationScheduleSyncDto.FromEntity).ToList(),
            MedicationIntakes = intakes.Rows.Select(MedicationIntakeSyncDto.FromEntity).ToList(),
            RelapseLogEntries = relapses.Rows.Select(RelapseLogEntrySyncDto.FromEntity).ToList(),
            Appointments = appointments.Rows.Select(AppointmentSyncDto.FromEntity).ToList(),
            VisitQuestions = questions.Rows.Select(VisitQuestionSyncDto.FromEntity).ToList(),
            Cursor = next.ToString(),
            HasMore = checkIns.More || medications.More || schedules.More || intakes.More || relapses.More
                      || appointments.More || questions.More,
        };

        async Task<(List<T> Rows, SyncCursor? Next, bool More)> ChangedPage<T>(SyncType type)
            where T : PatientOwnedEntity
        {
            var cursor = after[type];
            var rows = await sync.GetChangedAsync<T>(
                patientId, cursor?.ServerUpdatedAt, cursor?.Id ?? Guid.Empty, settled, limit + 1, ct);
            return Page(rows, limit, cursor);
        }
    }

    private static (List<T> Rows, SyncCursor? Next, bool More) Page<T>(
        IReadOnlyList<T> rows,
        int limit,
        SyncCursor? previous)
        where T : SyncedEntity
    {
        var page = rows.Take(limit).ToList();
        var next = page.Count > 0 ? new SyncCursor(page[^1].ServerUpdatedAt, page[^1].Id) : previous;
        return (page, next, rows.Count > limit);
    }

    private async Task<SyncRecordResult<CheckInSyncDto>> PushCheckInAsync(Guid patientId, CheckInSyncDto incoming, CancellationToken ct)
    {
        if (Validate(incoming) is { } problem)
        {
            return Rejected(incoming.Id, problem);
        }

        try
        {
            var existing = await sync.FindCheckInAsync(incoming.Id, ct);
            if (existing is not null && existing.PatientId != patientId)
            {
                return Rejected(incoming.Id, SyncReasons.NotFound);
            }

            if (existing is not null && existing.LocalDate != incoming.LocalDate)
            {
                return Rejected(incoming.Id, SyncReasons.LocalDateChanged);
            }

            if (incoming.DeletedAt is null
                && await sync.FindLiveCheckInForDayAsync(patientId, incoming.LocalDate, ct) is { } sameDay
                && sameDay.Id != incoming.Id)
            {
                if (IsNewer(incoming, sameDay))
                {
                    Apply(sameDay, incoming);
                }

                return await sync.TrySaveChangesAsync(ct)
                    ? SyncRecordResult<CheckInSyncDto>.Conflict(incoming.Id, CheckInSyncDto.FromEntity(sameDay))
                    : Rejected(incoming.Id, SyncReasons.RetryLater);
            }

            if (existing is null)
            {
                var checkIn = new CheckIn
                {
                    Id = incoming.Id,
                    PatientId = patientId,
                    LocalDate = incoming.LocalDate,
                    TimeZone = incoming.TimeZone,
                    QuestionnaireVersion = incoming.QuestionnaireVersion,
                    CreatedAt = incoming.CreatedAt.ToUniversalTime(),
                };
                Apply(checkIn, incoming);
                sync.AddCheckIn(checkIn);
            }
            else if (IsNewer(incoming, existing))
            {
                Apply(existing, incoming);
            }
            else
            {
                return Accepted(incoming.Id);
            }

            return await sync.TrySaveChangesAsync(ct)
                ? Accepted(incoming.Id)
                : Rejected(incoming.Id, SyncReasons.RetryLater);
        }
        catch (DbUpdateException ex)
        {
            logger.LogWarning(ex, "Check-in {CheckInId} was rejected by the database", incoming.Id);
            sync.ClearTracking();
            return Rejected(incoming.Id, SyncReasons.Invalid);
        }
    }

    private static string? Validate(CheckInSyncDto checkIn)
    {
        if (checkIn.Id == Guid.Empty)
        {
            return SyncReasons.Invalid;
        }

        if (!DailyCheckInQuestionnaire.ItemsByVersion.TryGetValue(checkIn.QuestionnaireVersion, out var expected))
        {
            return SyncReasons.UnknownQuestionnaireVersion;
        }

        var items = checkIn.Answers.Select(a => a.Item).ToList();
        if (items.Count != expected.Count
            || items.Distinct().Count() != items.Count
            || !expected.All(items.Contains)
            || checkIn.Answers.Any(a => a.Score < DailyCheckInQuestionnaire.MinScore
                                        || a.Score > DailyCheckInQuestionnaire.MaxScore))
        {
            return SyncReasons.InvalidAnswers;
        }

        if (!IsIanaTimeZone(checkIn.TimeZone))
        {
            return SyncReasons.InvalidTimeZone;
        }

        if (checkIn.Note?.Trim().Length > MaxNoteLength)
        {
            return SyncReasons.NoteTooLong;
        }

        if (checkIn.UpdatedAt < checkIn.CreatedAt)
        {
            return SyncReasons.InvalidTimestamps;
        }

        return null;
    }

    private static bool IsIanaTimeZone(string timeZone) =>
        timeZone.Length <= MaxTimeZoneLength
        && TimeZoneInfo.TryFindSystemTimeZoneById(timeZone, out var zone)
        && zone.HasIanaId;

    private static bool IsNewer(CheckInSyncDto incoming, CheckIn stored) =>
        incoming.UpdatedAt.ToUniversalTime() > stored.UpdatedAt;

    private static void Apply(CheckIn target, CheckInSyncDto source)
    {
        target.TimeZone = source.TimeZone;
        target.QuestionnaireVersion = source.QuestionnaireVersion;
        target.Note = string.IsNullOrWhiteSpace(source.Note) ? null : source.Note.Trim();
        target.UpdatedAt = source.UpdatedAt.ToUniversalTime();
        target.DeletedAt = source.DeletedAt?.ToUniversalTime();

        foreach (var stale in target.Answers.Where(a => source.Answers.All(s => s.Item != a.Item)).ToList())
        {
            target.Answers.Remove(stale);
        }

        foreach (var answer in source.Answers)
        {
            if (target.Answers.FirstOrDefault(a => a.Item == answer.Item) is { } current)
            {
                current.Score = answer.Score;
            }
            else
            {
                target.Answers.Add(new CheckInAnswer { Item = answer.Item, Score = answer.Score });
            }
        }
    }

    private static SyncRecordResult<CheckInSyncDto> Accepted(Guid id) => SyncRecordResult<CheckInSyncDto>.Accepted(id);

    private static SyncRecordResult<CheckInSyncDto> Rejected(Guid id, string reason) =>
        SyncRecordResult<CheckInSyncDto>.Rejected(id, reason);
}

public static class SyncReasons
{
    public const string Invalid = "invalid";
    public const string InvalidAnswers = "invalid-answers";
    public const string InvalidTimeZone = "invalid-time-zone";
    public const string InvalidTimestamps = "invalid-timestamps";
    public const string NoteTooLong = "note-too-long";
    public const string UnknownQuestionnaireVersion = "unknown-questionnaire-version";
    public const string LocalDateChanged = "local-date-changed";
    public const string NotFound = "not-found";
    public const string ConsentRequired = "consent-required";
    public const string RetryLater = "retry-later";
    public const string InvalidFields = "invalid-fields";
    public const string GuidanceMismatch = "guidance-mismatch";
    public const string UnknownMedication = "unknown-medication";
    public const string UnknownSchedule = "unknown-schedule";
    public const string MedicationChanged = "medication-changed";
    public const string UnknownAppointment = "unknown-appointment";
}
