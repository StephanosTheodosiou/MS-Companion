using Microsoft.EntityFrameworkCore;
using MSCompanion.Data.Interfaces;
using MSCompanion.Data.Models;
using MSCompanion.Domain.Enums;

namespace MSCompanion.Data.Repositories;

public class AppointmentRepository(AppDbContext context) : IAppointmentRepository
{
    public Task<List<Appointment>> GetAllAsync(
        Guid patientId,
        DateTimeOffset? from,
        DateTimeOffset? to,
        IReadOnlyCollection<AppointmentStatus>? statuses,
        CancellationToken ct = default)
    {
        var query = context.Appointments.AsNoTracking().Where(a => a.PatientId == patientId);

        if (from is { } start)
        {
            query = query.Where(a => a.StartsAt >= start);
        }

        if (to is { } end)
        {
            query = query.Where(a => a.StartsAt < end);
        }

        if (statuses is { Count: > 0 })
        {
            query = query.Where(a => statuses.Contains(a.Status));
        }

        return query.OrderBy(a => a.StartsAt).ToListAsync(ct);
    }

    public Task<Appointment?> GetAsync(Guid patientId, Guid appointmentId, CancellationToken ct = default) =>
        context.Appointments
            .Include(a => a.Questions)
            .FirstOrDefaultAsync(a => a.PatientId == patientId && a.Id == appointmentId, ct);

    public void Add(Appointment appointment) => context.Appointments.Add(appointment);

    public Task SaveChangesAsync(CancellationToken ct = default) => context.SaveChangesAsync(ct);
}
