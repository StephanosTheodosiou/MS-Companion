using MSCompanion.Domain.Enums;

namespace MSCompanion.Data.Models;

public class Patient : SyncedEntity
{
    public Guid UserId { get; set; }

    public User User { get; set; } = null!;

    public string? PreferredName { get; set; }

    public DateOnly? DateOfBirth { get; set; }

    public MsType? MsType { get; set; }

    public short? DiagnosisYear { get; set; }

    public string? MsTeamName { get; set; }

    public string? MsTeamPhone { get; set; }

    public string TimeZone { get; set; } = "Europe/Nicosia";

    public ICollection<ConsentRecord> ConsentRecords { get; set; } = [];
    public ICollection<CheckIn> CheckIns { get; set; } = [];
    public ICollection<TestSession> TestSessions { get; set; } = [];
    public ICollection<Medication> Medications { get; set; } = [];
    public ICollection<RelapseLogEntry> RelapseLogEntries { get; set; } = [];
    public ICollection<BloodTestReminder> BloodTestReminders { get; set; } = [];
    public ICollection<Appointment> Appointments { get; set; } = [];
    public ICollection<VisitQuestion> VisitQuestions { get; set; } = [];
    public ICollection<VisitReport> VisitReports { get; set; } = [];
}
