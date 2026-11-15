namespace MSCompanion.Domain.Enums;

/// <summary>
/// Which guidance screen the app showed for a relapse-log entry (US-01). Records what the patient was told.
/// Stored as text.
/// </summary>
public enum RelapseGuidance
{
    ContactMsTeamToday, // lasted > 24 h, no fever, no heat exposure
    MonitorAndRecheck,  // e.g. fever or heat present: log again if it persists
}
