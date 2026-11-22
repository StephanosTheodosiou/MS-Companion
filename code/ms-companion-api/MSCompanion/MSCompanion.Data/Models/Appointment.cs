using MSCompanion.Domain.Enums;

namespace MSCompanion.Data.Models;

/// <summary>A clinic appointment (E7). FHIR: Appointment.</summary>
public class Appointment : PatientOwnedEntity
{
    public DateTimeOffset StartsAt { get; set; }

    public DateTimeOffset? EndsAt { get; set; }

    /// <summary>Required by FHIR. "Since the last visit" in the visit summary means the last Fulfilled one.</summary>
    public AppointmentStatus Status { get; set; } = AppointmentStatus.Booked;

    public AppointmentType Type { get; set; }

    public string? ClinicianName { get; set; }

    public string? Location { get; set; }

    public string? Note { get; set; }

    public ICollection<VisitQuestion> Questions { get; set; } = [];
    public ICollection<VisitReport> Reports { get; set; } = [];
}
