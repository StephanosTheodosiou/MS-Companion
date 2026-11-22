using MSCompanion.Data.Models;

namespace MSCompanion.Data.Interfaces;

public interface IMedicationRepository
{
    Task<List<Medication>> GetAllAsync(Guid patientId, CancellationToken ct = default);

    Task<Medication?> GetAsync(Guid patientId, Guid medicationId, CancellationToken ct = default);

    Task<List<MedicationIntake>> GetIntakesAsync(
        Guid patientId,
        DateTimeOffset from,
        DateTimeOffset to,
        CancellationToken ct = default);

    void Add<T>(T entity) where T : PatientOwnedEntity;

    /// <summary>Returns false if a unique index was violated (e.g. a reminder slot already answered).</summary>
    Task<bool> TrySaveChangesAsync(CancellationToken ct = default);

    /// <summary>Marks all medication data of the patient as deleted. Does not save.</summary>
    Task MarkAllDeletedAsync(Guid patientId, DateTimeOffset now, CancellationToken ct = default);
}
