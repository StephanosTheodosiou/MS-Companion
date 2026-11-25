using Microsoft.EntityFrameworkCore;
using MSCompanion.Data.Interfaces;
using MSCompanion.Data.Models;

namespace MSCompanion.Data.Repositories;

public class SideEffectRepository(AppDbContext context) : ISideEffectRepository
{
    public Task<List<SideEffect>> GetAllAsync(
        Guid patientId,
        Guid? medicationId,
        bool? ongoing,
        CancellationToken ct = default)
    {
        var query = context.SideEffects
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Include(s => s.Medication)
            .Where(s => s.PatientId == patientId && s.DeletedAt == null);

        if (medicationId is { } id)
        {
            query = query.Where(s => s.MedicationId == id);
        }

        if (ongoing is { } value)
        {
            query = value ? query.Where(s => s.EndedOn == null) : query.Where(s => s.EndedOn != null);
        }

        return query.OrderByDescending(s => s.StartedOn).ThenByDescending(s => s.CreatedAt).ToListAsync(ct);
    }

    public Task<SideEffect?> GetAsync(Guid patientId, Guid sideEffectId, CancellationToken ct = default) =>
        context.SideEffects
            .IgnoreQueryFilters()
            .Include(s => s.Medication)
            .FirstOrDefaultAsync(s => s.PatientId == patientId && s.Id == sideEffectId && s.DeletedAt == null, ct);

    public Task<Medication?> FindMedicationAsync(Guid patientId, Guid medicationId, CancellationToken ct = default) =>
        context.Medications.FirstOrDefaultAsync(m => m.PatientId == patientId && m.Id == medicationId, ct);

    public void Add(SideEffect sideEffect) => context.SideEffects.Add(sideEffect);

    public Task SaveChangesAsync(CancellationToken ct = default) => context.SaveChangesAsync(ct);
}
