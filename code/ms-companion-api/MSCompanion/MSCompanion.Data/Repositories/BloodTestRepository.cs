using Microsoft.EntityFrameworkCore;
using MSCompanion.Data.Interfaces;
using MSCompanion.Data.Models;

namespace MSCompanion.Data.Repositories;

public class BloodTestRepository(AppDbContext context) : IBloodTestRepository
{
    public Task<List<BloodTestReminder>> GetAllAsync(Guid patientId, Guid? medicationId, CancellationToken ct = default)
    {
        var query = context.BloodTestReminders
            .AsNoTracking()
            .Include(r => r.Medication)
            .Where(r => r.PatientId == patientId);

        if (medicationId is { } id)
        {
            query = query.Where(r => r.MedicationId == id);
        }

        return query.OrderBy(r => r.DueDate).ThenBy(r => r.TestName).ToListAsync(ct);
    }

    public Task<BloodTestReminder?> GetAsync(Guid patientId, Guid reminderId, CancellationToken ct = default) =>
        context.BloodTestReminders
            .Include(r => r.Medication)
            .FirstOrDefaultAsync(r => r.PatientId == patientId && r.Id == reminderId, ct);

    public Task<Medication?> FindMedicationAsync(Guid patientId, Guid medicationId, CancellationToken ct = default) =>
        context.Medications.FirstOrDefaultAsync(m => m.PatientId == patientId && m.Id == medicationId, ct);

    public void Add(BloodTestReminder reminder) => context.BloodTestReminders.Add(reminder);

    public Task SaveChangesAsync(CancellationToken ct = default) => context.SaveChangesAsync(ct);
}
