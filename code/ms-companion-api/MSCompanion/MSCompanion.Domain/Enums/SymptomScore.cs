namespace MSCompanion.Domain.Enums;

/// <summary>Five-step scale used for all six check-in questions. Stored as a number (smallint 0–4).</summary>
public enum SymptomScore : short
{
    NotAtAll = 0,
    ALittle = 1,
    Moderately = 2,
    QuiteABit = 3,
    Extremely = 4,
}
