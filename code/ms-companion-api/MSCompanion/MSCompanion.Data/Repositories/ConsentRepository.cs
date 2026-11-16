using Microsoft.EntityFrameworkCore;
using MSCompanion.Data.Interfaces;
using MSCompanion.Data.Models;
using MSCompanion.Domain.Enums;

namespace MSCompanion.Data.Repositories;

public class ConsentRepository(AppDbContext context) : IConsentRepository
{
    public async Task<IReadOnlyList<ConsentRecord>> GetHistoryAsync(Guid patientId, CancellationToken ct = default) =>
        await context.ConsentRecords
            .AsNoTracking()
            .Where(c => c.PatientId == patientId)
            .OrderByDescending(c => c.CreatedAt)
            .ThenByDescending(c => c.Id) // Guid v7 is time-ordered: breaks ties within the same instant
            .ToListAsync(ct);

    public async Task<IReadOnlyDictionary<ConsentDataType, ConsentRecord>> GetCurrentAsync(
        Guid patientId,
        CancellationToken ct = default)
    {
        // A patient has a handful of consent rows at most, so pick the newest per type in memory.
        var history = await GetHistoryAsync(patientId, ct);
        return history
            .GroupBy(c => c.DataType)
            .ToDictionary(g => g.Key, g => g.First());
    }

    public async Task AddRangeAsync(IEnumerable<ConsentRecord> records, CancellationToken ct = default)
    {
        context.ConsentRecords.AddRange(records);
        await context.SaveChangesAsync(ct);
    }
}
