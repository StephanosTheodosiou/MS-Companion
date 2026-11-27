using MSCompanion.Domain.Enums;

namespace MSCompanion.Domain.Fhir;

public static class DailyCheckInQuestionnaire
{
    public const string Id = "daily-check-in";

    public const string Url = FhirCanonical.Base + "/Questionnaire/" + Id;

    public const string Name = "DailyCheckIn";

    public const string Title = "Daily check-in";

    public const string CurrentVersion = "2";

    public const short MinScore = 0;

    public const short MaxScore = 4;

    public const string AnswerSystemId = "symptom-impact";

    public const string AnswerSystem = FhirCanonical.Base + "/CodeSystem/" + AnswerSystemId;

    public const string AnswerSystemVersion = "1";

    public const string NoteLinkId = "note";

    public const string NoteText = "Add a note if something stood out today.";

    public const int NoteMaxLength = 1000;

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

    public static IReadOnlyList<string> AnswerLabels { get; } =
        ["Not at all", "A little", "Moderately", "Quite a bit", "Extremely"];

    public static string AnswerLabel(short score) => AnswerLabels[score - MinScore];

    public static string Text(CheckInItem item) => item switch
    {
        CheckInItem.Fatigue => "Fatigue",
        CheckInItem.Mobility => "Walking and balance problems",
        CheckInItem.Pain => "Pain",
        CheckInItem.Mood => "Low mood",
        CheckInItem.Cognition => "Memory and concentration problems",
        CheckInItem.Bladder => "Bladder problems",
        _ => throw new ArgumentOutOfRangeException(nameof(item), item, null),
    };

    public static string Question(CheckInItem item) => item switch
    {
        CheckInItem.Fatigue => "How much has fatigue affected you today?",
        CheckInItem.Mobility => "How much have walking or balance problems affected you today?",
        CheckInItem.Pain => "How much has pain affected you today?",
        CheckInItem.Mood => "How much has low mood affected you today?",
        CheckInItem.Cognition => "How much have memory or concentration problems affected you today?",
        CheckInItem.Bladder => "How much have bladder problems affected you today?",
        _ => throw new ArgumentOutOfRangeException(nameof(item), item, null),
    };
}
