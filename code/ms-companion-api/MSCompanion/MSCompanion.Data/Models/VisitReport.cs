namespace MSCompanion.Data.Models;

public class VisitReport : PatientOwnedEntity
{
    public Guid? AppointmentId { get; set; }

    public Appointment? Appointment { get; set; }

    public DateOnly PeriodStart { get; set; }

    public DateOnly PeriodEnd { get; set; }

    public DateTimeOffset GeneratedAt { get; set; }

    public required string FhirBundleJson { get; set; }

    public string FhirVersion { get; set; } = "4.0.1";
}
