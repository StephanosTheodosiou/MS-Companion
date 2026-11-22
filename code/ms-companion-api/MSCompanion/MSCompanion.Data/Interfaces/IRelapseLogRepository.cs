using MSCompanion.Data.Models;

namespace MSCompanion.Data.Interfaces;

public interface IRelapseLogRepository
{
    Task<List<RelapseLogEntry>> GetAllAsync(Guid patientId, CancellationToken ct = default);

    Task<RelapseLogEntry?> GetAsync(Guid patientId, Guid entryId, CancellationToken ct = default);

    void Add(RelapseLogEntry entry);

    Task SaveChangesAsync(CancellationToken ct = default);
}
