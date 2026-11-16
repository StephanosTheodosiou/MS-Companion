using MSCompanion.Domain.Enums;

namespace MSCompanion.Data.Models;

/// <summary>
/// The person with MS. FHIR: Patient.
/// Kept separate from <see cref="User"/>: "who is logged in" is not the same as "whose health data this is",
/// which lets caregiver accounts (E10) be added later without reshaping the health tables.
/// Every profile field is optional (data minimisation; onboarding lets the user skip them).
/// Not soft-deletable: removing a patient is a GDPR erasure, a hard cascading delete.
/// </summary>
public class Patient : SyncedEntity
{
    public Guid UserId { get; set; }

    public User User { get; set; } = null!;

    /// <summary>Name shown on the visit report. Optional.</summary>
    public string? PreferredName { get; set; }

    /// <summary>Optional; helps the clinic match the report to the right person.</summary>
    public DateOnly? DateOfBirth { get; set; }

    public MsType? MsType { get; set; }

    public short? DiagnosisYear { get; set; }

    public string? MsTeamName { get; set; }

    public string? MsTeamPhone { get; set; }

    /// <summary>IANA time zone. Decides which calendar day a check-in belongs to and when reminders fire.</summary>
    public string TimeZone { get; set; } = "Europe/Nicosia";

    public ICollection<ConsentRecord> ConsentRecords { get; set; } = [];
    public ICollection<SymptomCheckin> SymptomCheckins { get; set; } = [];
    public ICollection<Medication> Medications { get; set; } = [];
    public ICollection<RelapseLogEntry> RelapseLogEntries { get; set; } = [];
    public ICollection<BloodTestReminder> BloodTestReminders { get; set; } = [];
    public ICollection<Appointment> Appointments { get; set; } = [];
    public ICollection<VisitQuestion> VisitQuestions { get; set; } = [];
    public ICollection<VisitReport> VisitReports { get; set; } = [];
}
