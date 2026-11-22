using Microsoft.EntityFrameworkCore;
using MSCompanion.Data.Interfaces;
using MSCompanion.Data.Models;

namespace MSCompanion.Data.Repositories;

public class RelapseLogRepository(AppDbContext context) : IRelapseLogRepository
{
    public Task<List<RelapseLogEntry>> GetAllAsync(Guid patientId, CancellationToken ct = default) =>
        context.RelapseLogEntries
            .AsNoTracking()
            .Where(e => e.PatientId == patientId)
            .OrderByDescending(e => e.OnsetDate)
            .ThenByDescending(e => e.CreatedAt)
            .ToListAsync(ct);

    public Task<RelapseLogEntry?> GetAsync(Guid patientId, Guid entryId, CancellationToken ct = default) =>
        context.RelapseLogEntries.FirstOrDefaultAsync(e => e.PatientId == patientId && e.Id == entryId, ct);

    public void Add(RelapseLogEntry entry) => context.RelapseLogEntries.Add(entry);

    public Task SaveChangesAsync(CancellationToken ct = default) => context.SaveChangesAsync(ct);
}
