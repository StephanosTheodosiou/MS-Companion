namespace MSCompanion.Data.Interfaces;

public interface IPurgeRepository
{
    Task<Dictionary<string, int>> PurgeDeletedBeforeAsync(DateTimeOffset cutoff, CancellationToken ct = default);
}
