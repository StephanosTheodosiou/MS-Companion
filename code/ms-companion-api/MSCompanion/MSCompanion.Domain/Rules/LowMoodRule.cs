namespace MSCompanion.Domain.Rules;

public static class LowMoodRule
{
    public const short Threshold = 3;

    public static bool IsLowMood(short moodScore) => moodScore >= Threshold;
}
