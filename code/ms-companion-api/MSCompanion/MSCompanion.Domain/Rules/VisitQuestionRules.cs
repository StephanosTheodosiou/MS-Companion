namespace MSCompanion.Domain.Rules;

public static class VisitQuestionRules
{
    public const int TextMaxLength = 1000;
    public const int AnswerNoteMaxLength = 1000;

    public static bool AnswerFitsAsked(bool asked, string? answerNote) =>
        asked || string.IsNullOrWhiteSpace(answerNote);
}
