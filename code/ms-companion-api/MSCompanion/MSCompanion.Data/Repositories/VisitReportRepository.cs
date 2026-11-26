using Microsoft.EntityFrameworkCore;
using MSCompanion.Data.Interfaces;
using MSCompanion.Data.Models;
using MSCompanion.Domain.Enums;

namespace MSCompanion.Data.Repositories;

public class VisitReportRepository(AppDbContext context) : IVisitReportRepository
{
    public Task<Patient?> GetPatientWithUserAsync(Guid patientId, CancellationToken ct = default) =>
        context.Patients
            .AsNoTracking()
            .Include(p => p.User)
            .FirstOrDefaultAsync(p => p.Id == patientId, ct);

    public Task<Appointment?> GetAppointmentAsync(Guid patientId, Guid appointmentId, CancellationToken ct = default) =>
        context.Appointments
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.PatientId == patientId && a.Id == appointmentId, ct);

    public Task<Appointment?> GetLastFulfilledAppointmentAsync(
        Guid patientId,
        DateTimeOffset before,
        CancellationToken ct = default) =>
        context.Appointments
            .AsNoTracking()
            .Where(a => a.PatientId == patientId && a.Status == AppointmentStatus.Fulfilled && a.StartsAt < before)
            .OrderByDescending(a => a.StartsAt)
            .FirstOrDefaultAsync(ct);

    public Task<Appointment?> GetNextBookedAppointmentAsync(
        Guid patientId,
        DateTimeOffset from,
        CancellationToken ct = default) =>
        context.Appointments
            .AsNoTracking()
            .Where(a => a.PatientId == patientId && a.Status == AppointmentStatus.Booked && a.StartsAt >= from)
            .OrderBy(a => a.StartsAt)
            .FirstOrDefaultAsync(ct);

    public Task<List<CheckIn>> GetCheckInsAsync(
        Guid patientId,
        DateOnly from,
        DateOnly to,
        CancellationToken ct = default) =>
        context.CheckIns
            .AsNoTracking()
            .Include(c => c.Answers)
            .Where(c => c.PatientId == patientId && c.LocalDate >= from && c.LocalDate <= to)
            .ToListAsync(ct);

    public Task<List<RelapseLogEntry>> GetRelapsesAsync(
        Guid patientId,
        DateOnly from,
        DateOnly to,
        CancellationToken ct = default) =>
        context.RelapseLogEntries
            .AsNoTracking()
            .Where(e => e.PatientId == patientId
                        && e.OnsetDate <= to
                        && (e.OnsetDate >= from || e.ResolvedOn == null || e.ResolvedOn >= from))
            .OrderBy(e => e.OnsetDate)
            .ThenBy(e => e.CreatedAt)
            .ToListAsync(ct);

    public Task<List<Medication>> GetMedicationsAsync(Guid patientId, CancellationToken ct = default) =>
        context.Medications
            .AsNoTracking()
            .Where(m => m.PatientId == patientId)
            .ToListAsync(ct);

    public Task<List<MedicationIntake>> GetIntakesAsync(
        Guid patientId,
        DateTimeOffset fromUtc,
        DateTimeOffset toUtc,
        CancellationToken ct = default) =>
        context.MedicationIntakes
            .AsNoTracking()
            .Where(i => i.PatientId == patientId
                        && ((i.ScheduledFor != null && i.ScheduledFor >= fromUtc && i.ScheduledFor < toUtc)
                            || (i.ScheduledFor == null && i.TakenAt >= fromUtc && i.TakenAt < toUtc)))
            .ToListAsync(ct);

    public Task<List<SideEffect>> GetSideEffectsAsync(
        Guid patientId,
        DateOnly from,
        DateOnly to,
        CancellationToken ct = default) =>
        context.SideEffects
            .AsNoTracking()
            .Include(s => s.Medication)
            .Where(s => s.PatientId == patientId && s.StartedOn <= to && (s.EndedOn == null || s.EndedOn >= from))
            .OrderBy(s => s.StartedOn)
            .ToListAsync(ct);

    public Task<List<BloodTestReminder>> GetOpenBloodTestsAsync(Guid patientId, CancellationToken ct = default) =>
        context.BloodTestReminders
            .AsNoTracking()
            .Include(b => b.Medication)
            .Where(b => b.PatientId == patientId && b.CompletedOn == null)
            .OrderBy(b => b.DueDate)
            .ToListAsync(ct);

    public Task<List<VisitQuestion>> GetOpenQuestionsAsync(
        Guid patientId,
        Guid? appointmentId,
        CancellationToken ct = default) =>
        context.VisitQuestions
            .AsNoTracking()
            .Where(q => q.PatientId == patientId
                        && !q.Asked
                        && (q.AppointmentId == null || q.AppointmentId == appointmentId))
            .OrderBy(q => q.CreatedAt)
            .ToListAsync(ct);

    public Task<List<VisitReport>> GetAllAsync(Guid patientId, CancellationToken ct = default) =>
        context.VisitReports
            .AsNoTracking()
            .Where(r => r.PatientId == patientId && r.DeletedAt == null)
            .OrderByDescending(r => r.GeneratedAt)
            .ToListAsync(ct);

    public Task<VisitReport?> GetAsync(Guid patientId, Guid reportId, CancellationToken ct = default) =>
        context.VisitReports
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.PatientId == patientId && r.Id == reportId && r.DeletedAt == null, ct);

    public void Add(VisitReport report) => context.VisitReports.Add(report);

    public Task SaveChangesAsync(CancellationToken ct = default) => context.SaveChangesAsync(ct);
}
