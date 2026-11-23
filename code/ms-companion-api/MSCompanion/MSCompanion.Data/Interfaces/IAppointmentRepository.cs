using MSCompanion.Data.Models;
using MSCompanion.Domain.Enums;

namespace MSCompanion.Data.Interfaces;

public interface IAppointmentRepository
{
    Task<List<Appointment>> GetAllAsync(
        Guid patientId,
        DateTimeOffset? from,
        DateTimeOffset? to,
        IReadOnlyCollection<AppointmentStatus>? statuses,
        CancellationToken ct = default);

    Task<Appointment?> GetAsync(Guid patientId, Guid appointmentId, CancellationToken ct = default);

    void Add(Appointment appointment);

    Task SaveChangesAsync(CancellationToken ct = default);
}
