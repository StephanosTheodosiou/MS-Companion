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

        if (request.CheckIns.Count == 0)
        {
            return new SyncPushResponse { CheckIns = [] };
        }

        if (!await consents.IsGrantedAsync(patientId, ConsentDataType.SymptomCheckins, ct))
        {
            return new SyncPushResponse
            {
                CheckIns = request.CheckIns.Select(c => Rejected(c.Id, SyncReasons.ConsentRequired)).ToList(),
            };
        }

        var results = new List<SyncRecordResult>(request.CheckIns.Count);
        await using var transaction = await sync.BeginTransactionAsync(ct);

        foreach (var incoming in request.CheckIns)
        {
            results.Add(await PushCheckInAsync(patientId, incoming, ct));
        }

        await transaction.CommitAsync(ct);
        return new SyncPushResponse { CheckIns = results };
    }

    public async Task<SyncPullResponse?> PullAsync(Guid userId, SyncCursor? after, int limit, CancellationToken ct = default)
    {
        if (await patients.GetIdByUserIdAsync(userId, ct) is not { } patientId)
        {
            return null;
        }

        var rows = await sync.GetCheckInsChangedAsync(
            patientId,
            after?.ServerUpdatedAt,
            after?.Id ?? Guid.Empty,
            clock.GetUtcNow() - SettleDelay,
            limit + 1,
            ct);

        var page = rows.Take(limit).ToList();
        var next = page.Count > 0 ? new SyncCursor(page[^1].ServerUpdatedAt, page[^1].Id) : after;

        return new SyncPullResponse
        {
            CheckIns = page.Select(CheckInSyncDto.FromEntity).ToList(),
            Cursor = next?.ToString(),
            HasMore = rows.Count > limit,
        };
    }

    private async Task<SyncRecordResult> PushCheckInAsync(Guid patientId, CheckInSyncDto incoming, CancellationToken ct)
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
                    ? new SyncRecordResult
                    {
                        Id = incoming.Id,
                        Outcome = SyncOutcome.Conflict,
                        ServerCopy = CheckInSyncDto.FromEntity(sameDay),
                    }
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

        if (checkIn.QuestionnaireVersion != DailyCheckInQuestionnaire.Version)
        {
            return SyncReasons.UnknownQuestionnaireVersion;
        }

        var items = checkIn.Answers.Select(a => a.Item).ToList();
        var expected = DailyCheckInQuestionnaire.Items;
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

    private static SyncRecordResult Accepted(Guid id) => new() { Id = id, Outcome = SyncOutcome.Accepted };

    private static SyncRecordResult Rejected(Guid id, string reason) =>
        new() { Id = id, Outcome = SyncOutcome.Rejected, Reason = reason };
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
}
