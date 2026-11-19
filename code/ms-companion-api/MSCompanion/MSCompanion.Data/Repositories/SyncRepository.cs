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
