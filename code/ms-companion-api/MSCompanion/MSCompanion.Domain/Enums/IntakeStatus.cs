namespace MSCompanion.Domain.Enums;

/// <summary>Stored as text.</summary>
public enum IntakeStatus
{
    Taken,
    Skipped, // patient chose not to take it and said so
    Missed,  // reminder passed with no answer
}
