namespace MSCompanion.Data.Models;

public class CheckIn : PatientOwnedEntity
{
    public DateOnly LocalDate { get; set; }

    public required string TimeZone { get; set; }

    public required string QuestionnaireVersion { get; set; }

    public string? Note { get; set; }

    public ICollection<CheckInAnswer> Answers { get; set; } = [];
}
