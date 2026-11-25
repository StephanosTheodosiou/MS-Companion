namespace MSCompanion.Domain.Rules;

public static class SideEffectRules
{
    public const int DescriptionMaxLength = 500;
    public const int NoteMaxLength = 1000;

    public static bool DatesValid(DateOnly startedOn, DateOnly? endedOn, DateOnly latestAllowed) =>
        startedOn <= latestAllowed
        && (endedOn is not { } end || (end >= startedOn && end <= latestAllowed));
}
