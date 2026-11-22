namespace MSCompanion.Domain.Enums;

/// <summary>
/// Stored as text. Values map one-to-one to FHIR R4 Appointment.status
/// (booked | fulfilled | cancelled | noshow), which FHIR requires on every appointment.
/// </summary>
public enum AppointmentStatus
{
    Booked,
    Fulfilled,
    Cancelled,
    NoShow,
}
