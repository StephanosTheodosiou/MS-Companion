using Microsoft.EntityFrameworkCore.Storage;
using MSCompanion.Data.Models;

namespace MSCompanion.Data.Interfaces;

public interface ISyncRepository
{
    Task<IDbContextTransaction> BeginTransactionAsync(CancellationToken ct = default);

    Task<CheckIn?> FindCheckInAsync(Guid id, CancellationToken ct = default);

    Task<CheckIn?> FindLiveCheckInForDayAsync(Guid patientId, DateOnly localDate, CancellationToken ct = default);

    void AddCheckIn(CheckIn checkIn);

    Task<bool> TrySaveChangesAsync(CancellationToken ct = default);

    void ClearTracking();

    Task<IReadOnlyList<CheckIn>> GetCheckInsChangedAsync(
        Guid patientId,
        DateTimeOffset? afterServerUpdatedAt,
        Guid afterId,
        DateTimeOffset settledBefore,
        int take,
        CancellationToken ct = default);
}
