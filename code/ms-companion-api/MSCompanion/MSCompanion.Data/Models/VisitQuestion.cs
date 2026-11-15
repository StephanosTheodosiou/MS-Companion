namespace MSCompanion.Data.Models;

/// <summary>
/// A question or description the patient wants to raise with the doctor.
/// Can be written before any appointment exists (AppointmentId null) and attached later.
/// Appears in the report's "Questions for my doctor" section.
/// </summary>
public class VisitQuestion : PatientOwnedEntity
{
    public Guid? AppointmentId { get; set; }

    public Appointment? Appointment { get; set; }

    public required string Text { get; set; }

    public bool Asked { get; set; }

    public string? AnswerNote { get; set; }
}
