using Microsoft.EntityFrameworkCore;
using MSCompanion.Data.Interfaces;
using MSCompanion.Data.Models;

namespace MSCompanion.Data.Repositories;

public class PatientRepository(AppDbContext context) : IPatientRepository
{
    public Task<Patient?> GetByUserIdAsync(Guid userId, CancellationToken ct = default) =>
        context.Patients.AsNoTracking().FirstOrDefaultAsync(p => p.UserId == userId, ct);

    public Task<Patient?> GetByUserIdForUpdateAsync(Guid userId, CancellationToken ct = default) =>
        context.Patients.FirstOrDefaultAsync(p => p.UserId == userId, ct);

    public Task<Guid?> GetIdByUserIdAsync(Guid userId, CancellationToken ct = default) =>
        context.Patients
            .Where(p => p.UserId == userId)
            .Select(p => (Guid?)p.Id)
            .FirstOrDefaultAsync(ct);

    public Task SaveChangesAsync(CancellationToken ct = default) => context.SaveChangesAsync(ct);
}
