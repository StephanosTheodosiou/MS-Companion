using MSCompanion.Data.Models;

namespace MSCompanion.Data.Interfaces;

public interface IVisitReportRepository
{
    Task<Patient?> GetPatientWithUserAsync(Guid patientId, CancellationToken ct = default);

    Task<Appointment?> GetAppointmentAsync(Guid patientId, Guid appointmentId, CancellationToken ct = default);

    Task<Appointment?> GetLastFulfilledAppointmentAsync(
        Guid patientId,
        DateTimeOffset before,
        CancellationToken ct = default);

    Task<Appointment?> GetNextBookedAppointmentAsync(
        Guid patientId,
        DateTimeOffset from,
        CancellationToken ct = default);

    Task<List<CheckIn>> GetCheckInsAsync(Guid patientId, DateOnly from, DateOnly to, CancellationToken ct = default);

    Task<List<RelapseLogEntry>> GetRelapsesAsync(
        Guid patientId,
        DateOnly from,
        DateOnly to,
        CancellationToken ct = default);

    Task<List<Medication>> GetMedicationsAsync(Guid patientId, CancellationToken ct = default);

    Task<List<MedicationIntake>> GetIntakesAsync(
        Guid patientId,
        DateTimeOffset fromUtc,
        DateTimeOffset toUtc,
        CancellationToken ct = default);

    Task<List<SideEffect>> GetSideEffectsAsync(
        Guid patientId,
        DateOnly from,
        DateOnly to,
        CancellationToken ct = default);

    Task<List<BloodTestReminder>> GetOpenBloodTestsAsync(Guid patientId, CancellationToken ct = default);

    Task<List<VisitQuestion>> GetOpenQuestionsAsync(
        Guid patientId,
        Guid? appointmentId,
        CancellationToken ct = default);

    Task<List<VisitReport>> GetAllAsync(Guid patientId, CancellationToken ct = default);

    Task<VisitReport?> GetAsync(Guid patientId, Guid reportId, CancellationToken ct = default);

    void Add(VisitReport report);

    Task SaveChangesAsync(CancellationToken ct = default);
}
