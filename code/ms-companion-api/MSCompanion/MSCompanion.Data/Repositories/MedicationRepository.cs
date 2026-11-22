using Microsoft.EntityFrameworkCore;
using MSCompanion.Data.Interfaces;
using MSCompanion.Data.Models;
using Npgsql;

namespace MSCompanion.Data.Repositories;

public class MedicationRepository(AppDbContext context) : IMedicationRepository
{
    public Task<List<Medication>> GetAllAsync(Guid patientId, CancellationToken ct = default) =>
        context.Medications
            .AsNoTracking()
            .Include(m => m.Schedules)
            .Where(m => m.PatientId == patientId)
            .OrderBy(m => m.Name)
            .ToListAsync(ct);

    public Task<Medication?> GetAsync(Guid patientId, Guid medicationId, CancellationToken ct = default) =>
        context.Medications
            .Include(m => m.Schedules)
            .Include(m => m.Intakes)
            .FirstOrDefaultAsync(m => m.PatientId == patientId && m.Id == medicationId, ct);

    public Task<List<MedicationIntake>> GetIntakesAsync(
        Guid patientId,
        DateTimeOffset from,
        DateTimeOffset to,
        CancellationToken ct = default) =>
        context.MedicationIntakes
            .AsNoTracking()
            .Where(i => i.PatientId == patientId
                        && (i.ScheduledFor ?? i.TakenAt) >= from
                        && (i.ScheduledFor ?? i.TakenAt) < to)
            .OrderByDescending(i => i.ScheduledFor ?? i.TakenAt)
            .ToListAsync(ct);

    public void Add<T>(T entity) where T : PatientOwnedEntity => context.Add(entity);

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

    public async Task MarkAllDeletedAsync(Guid patientId, DateTimeOffset now, CancellationToken ct = default)
    {
        var medications = await context.Medications
            .Include(m => m.Schedules)
            .Include(m => m.Intakes)
            .Where(m => m.PatientId == patientId)
            .ToListAsync(ct);

        var sideEffects = await context.SideEffects
            .Where(s => s.PatientId == patientId && s.MedicationId != null)
            .ToListAsync(ct);

        var bloodTests = await context.BloodTestReminders
            .Where(b => b.PatientId == patientId && b.MedicationId != null)
            .ToListAsync(ct);

        IEnumerable<PatientOwnedEntity> rows = medications
            .Concat<PatientOwnedEntity>(medications.SelectMany(m => m.Schedules))
            .Concat(medications.SelectMany(m => m.Intakes))
            .Concat(sideEffects)
            .Concat(bloodTests);

        foreach (var row in rows)
        {
            row.DeletedAt = now;
            row.UpdatedAt = now;
        }
    }
}
