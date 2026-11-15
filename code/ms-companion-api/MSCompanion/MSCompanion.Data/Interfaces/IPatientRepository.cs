using MSCompanion.Data.Models;

namespace MSCompanion.Data.Interfaces;

public interface IPatientRepository
{
    /// <summary>Read-only (not tracked). Use for GET requests.</summary>
    Task<Patient?> GetByUserIdAsync(Guid userId, CancellationToken ct = default);

    /// <summary>Tracked, so changes are written by <see cref="SaveChangesAsync"/>. Use for updates.</summary>
    Task<Patient?> GetByUserIdForUpdateAsync(Guid userId, CancellationToken ct = default);

    Task SaveChangesAsync(CancellationToken ct = default);
}
