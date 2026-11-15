using MSCompanion.Data.Models;

namespace MSCompanion.Data.Interfaces;

public interface IPatientRepository
{
    /// <summary>Read-only (not tracked). Use for GET requests.</summary>
    Task<Patient?> GetByUserIdAsync(Guid userId, CancellationToken ct = default);

    /// <summary>Tracked, so changes are written by <see cref="SaveChangesAsync"/>. Use for updates.</summary>
    Task<Patient?> GetByUserIdForUpdateAsync(Guid userId, CancellationToken ct = default);

    /// <summary>
    /// Only the patient id of the signed-in user (cheap). Every health-data endpoint uses this to scope
    /// its queries, so a user can never reach another patient's rows. Null if the user has no patient.
    /// </summary>
    Task<Guid?> GetIdByUserIdAsync(Guid userId, CancellationToken ct = default);

    Task SaveChangesAsync(CancellationToken ct = default);
}
