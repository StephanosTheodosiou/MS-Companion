using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using MSCompanion.Data.Interfaces;
using MSCompanion.Data.Models;
using Npgsql;

namespace MSCompanion.Data.Repositories;

public class SyncRepository(AppDbContext context) : ISyncRepository
{
    public Task<IDbContextTransaction> BeginTransactionAsync(CancellationToken ct = default) =>
        context.Database.BeginTransactionAsync(ct);

    public Task<CheckIn?> FindCheckInAsync(Guid id, CancellationToken ct = default) =>
        context.CheckIns
            .IgnoreQueryFilters()
            .Include(c => c.Answers)
            .FirstOrDefaultAsync(c => c.Id == id, ct);

    public Task<CheckIn?> FindLiveCheckInForDayAsync(Guid patientId, DateOnly localDate, CancellationToken ct = default) =>
        context.CheckIns
            .Include(c => c.Answers)
            .FirstOrDefaultAsync(c => c.PatientId == patientId && c.LocalDate == localDate, ct);

    public void AddCheckIn(CheckIn checkIn) => context.CheckIns.Add(checkIn);

    public async Task<bool> TrySaveChangesAsync(CancellationToken ct = default)
    {
        try
        {
            await context.SaveChangesAsync(ct);
            return true;
        }
        catch (DbUpdateException ex) when (
            ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            context.ChangeTracker.Clear();
            return false;
        }
    }

    public void ClearTracking() => context.ChangeTracker.Clear();

    public Task<T?> FindAsync<T>(Guid id, CancellationToken ct = default)
        where T : PatientOwnedEntity =>
        context.Set<T>().IgnoreQueryFilters().FirstOrDefaultAsync(e => e.Id == id, ct);

    public void Add<T>(T entity)
        where T : PatientOwnedEntity => context.Set<T>().Add(entity);

    public Task<MedicationIntake?> FindLiveIntakeForSlotAsync(
        Guid scheduleId,
        DateTimeOffset scheduledFor,
        CancellationToken ct = default) =>
        context.MedicationIntakes.FirstOrDefaultAsync(
            i => i.ScheduleId == scheduleId && i.ScheduledFor == scheduledFor, ct);

    public async Task<List<PatientOwnedEntity>> GetLiveMedicationChildrenAsync(
        Guid medicationId,
        CancellationToken ct = default)
    {
        var schedules = await context.MedicationSchedules.Where(s => s.MedicationId == medicationId).ToListAsync(ct);
        var intakes = await context.MedicationIntakes.Where(i => i.MedicationId == medicationId).ToListAsync(ct);
        return [.. schedules, .. intakes];
    }

    public Task<List<VisitQuestion>> GetLiveQuestionsForAppointmentAsync(
        Guid appointmentId,
        CancellationToken ct = default) =>
        context.VisitQuestions.Where(q => q.AppointmentId == appointmentId).ToListAsync(ct);

    public async Task<IReadOnlyList<T>> GetChangedAsync<T>(
        Guid patientId,
        DateTimeOffset? afterServerUpdatedAt,
        Guid afterId,
        DateTimeOffset settledBefore,
        int take,
        CancellationToken ct = default)
        where T : PatientOwnedEntity
    {
        var query = context.Set<T>()
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(e => e.PatientId == patientId && e.ServerUpdatedAt <= settledBefore);

        if (afterServerUpdatedAt is { } after)
        {
            query = query.Where(e => e.ServerUpdatedAt > after || (e.ServerUpdatedAt == after && e.Id > afterId));
        }

        return await query
            .OrderBy(e => e.ServerUpdatedAt)
            .ThenBy(e => e.Id)
            .Take(take)
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<CheckIn>> GetCheckInsChangedAsync(
        Guid patientId,
        DateTimeOffset? afterServerUpdatedAt,
        Guid afterId,
        DateTimeOffset settledBefore,
        int take,
        CancellationToken ct = default)
    {
        var query = context.CheckIns
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(c => c.PatientId == patientId && c.ServerUpdatedAt <= settledBefore);

        if (afterServerUpdatedAt is { } after)
        {
            query = query.Where(c => c.ServerUpdatedAt > after || (c.ServerUpdatedAt == after && c.Id > afterId));
        }

        return await query
            .OrderBy(c => c.ServerUpdatedAt)
            .ThenBy(c => c.Id)
            .Take(take)
            .Include(c => c.Answers)
            .ToListAsync(ct);
    }
}
