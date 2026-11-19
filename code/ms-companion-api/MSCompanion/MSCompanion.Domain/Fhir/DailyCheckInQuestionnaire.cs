using MSCompanion.Domain.Enums;

namespace MSCompanion.Domain.Fhir;

public static class DailyCheckInQuestionnaire
{
    public const string Version = "1";

    public const short MinScore = 0;

    public const short MaxScore = 10;

    public static IReadOnlyList<CheckInItem> Items { get; } =
    [
        CheckInItem.Fatigue,
        CheckInItem.Mobility,
        CheckInItem.Mood,
    ];
}
