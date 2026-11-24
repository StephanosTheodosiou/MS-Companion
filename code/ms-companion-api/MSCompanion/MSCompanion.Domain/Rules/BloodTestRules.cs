namespace MSCompanion.Domain.Rules;

public static class BloodTestRules
{
    public const int TestNameMaxLength = 150;
    public const short MinRepeatWeeks = 1;
    public const short MaxRepeatWeeks = 104;

    public static bool RepeatValid(short? repeatEveryWeeks) =>
        repeatEveryWeeks is null or >= MinRepeatWeeks and <= MaxRepeatWeeks;

    public static DateOnly NextDueDate(DateOnly completedOn, short repeatEveryWeeks) =>
        completedOn.AddDays(repeatEveryWeeks * 7);
}
