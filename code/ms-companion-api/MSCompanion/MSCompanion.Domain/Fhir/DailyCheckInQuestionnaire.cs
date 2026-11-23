using MSCompanion.Domain.Enums;

namespace MSCompanion.Domain.Fhir;

public static class DailyCheckInQuestionnaire
{
    public const string CurrentVersion = "2";

    public const short MinScore = 0;

    public const short MaxScore = 10;

    public static IReadOnlyDictionary<string, IReadOnlyList<CheckInItem>> ItemsByVersion { get; } =
        new Dictionary<string, IReadOnlyList<CheckInItem>>
        {
            ["1"] = [CheckInItem.Fatigue, CheckInItem.Mobility, CheckInItem.Mood],
            ["2"] =
            [
                CheckInItem.Fatigue,
                CheckInItem.Mobility,
                CheckInItem.Pain,
                CheckInItem.Mood,
                CheckInItem.Cognition,
                CheckInItem.Bladder,
            ],
        };

    public static IReadOnlyList<CheckInItem> Items => ItemsByVersion[CurrentVersion];

    public static string Text(CheckInItem item) => item switch
    {
        CheckInItem.Fatigue => "Fatigue",
        CheckInItem.Mobility => "Walking and mobility problems",
        CheckInItem.Pain => "Pain",
        CheckInItem.Mood => "Low mood",
        CheckInItem.Cognition => "Thinking and memory problems",
        CheckInItem.Bladder => "Bladder problems",
        _ => throw new ArgumentOutOfRangeException(nameof(item), item, null),
    };
}
