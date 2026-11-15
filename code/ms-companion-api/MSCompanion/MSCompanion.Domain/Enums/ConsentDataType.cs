namespace MSCompanion.Domain.Enums;

/// <summary>One consent decision per data type (GDPR: specific, separately withdrawable). Stored as text.</summary>
public enum ConsentDataType
{
    SymptomCheckins,  // required to use the app
    Medication,
    Reminders,
    Location,         // E5 heat alert
    FunctionTests,    // E4, later
    PassiveSensing,   // E11, later
    CaregiverSharing, // E10, later
}
