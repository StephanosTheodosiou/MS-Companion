using System.ComponentModel.DataAnnotations;
using MSCompanion.Data.Models;
using MSCompanion.Domain.Enums;

namespace MSCompanion.Api.Dto;

public sealed class SyncPushRequest
{
    [Required, MaxLength(50)]
    public List<CheckInSyncDto> CheckIns { get; init; } = [];
}

public sealed class SyncPushResponse
{
    public required List<SyncRecordResult> CheckIns { get; init; }
}

public sealed class SyncPullResponse
{
    public required List<CheckInSyncDto> CheckIns { get; init; }

    public required string? Cursor { get; init; }

    public required bool HasMore { get; init; }
}

public enum SyncOutcome
{
    Accepted,
    Rejected,
    Conflict,
}

public sealed class SyncRecordResult
{
    public required Guid Id { get; init; }

    public required SyncOutcome Outcome { get; init; }

    public string? Reason { get; init; }

    public CheckInSyncDto? ServerCopy { get; init; }
}

public sealed class CheckInSyncDto
{
    public required Guid Id { get; init; }

    public required DateOnly LocalDate { get; init; }

    public required string TimeZone { get; init; }

    public required string QuestionnaireVersion { get; init; }

    public string? Note { get; init; }

    public required List<CheckInAnswerSyncDto> Answers { get; init; }

    public required DateTimeOffset CreatedAt { get; init; }

    public required DateTimeOffset UpdatedAt { get; init; }

    public DateTimeOffset? DeletedAt { get; init; }

    public static CheckInSyncDto FromEntity(CheckIn checkIn) => new()
    {
        Id = checkIn.Id,
        LocalDate = checkIn.LocalDate,
        TimeZone = checkIn.TimeZone,
        QuestionnaireVersion = checkIn.QuestionnaireVersion,
        Note = checkIn.Note,
        Answers = checkIn.Answers
            .OrderBy(a => a.Item)
            .Select(a => new CheckInAnswerSyncDto { Item = a.Item, Score = a.Score })
            .ToList(),
        CreatedAt = checkIn.CreatedAt,
        UpdatedAt = checkIn.UpdatedAt,
        DeletedAt = checkIn.DeletedAt,
    };
}

public sealed class CheckInAnswerSyncDto
{
    public required CheckInItem Item { get; init; }

    public required short Score { get; init; }
}
