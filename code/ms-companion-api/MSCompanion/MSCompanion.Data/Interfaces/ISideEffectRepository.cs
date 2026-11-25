using MSCompanion.Data.Models;

namespace MSCompanion.Data.Interfaces;

public interface ISideEffectRepository
{
    Task<List<SideEffect>> GetAllAsync(
        Guid patientId,
        Guid? medicationId,
        bool? ongoing,
        CancellationToken ct = default);

    Task<SideEffect?> GetAsync(Guid patientId, Guid sideEffectId, CancellationToken ct = default);

    Task<Medication?> FindMedicationAsync(Guid patientId, Guid medicationId, CancellationToken ct = default);

    void Add(SideEffect sideEffect);

    Task SaveChangesAsync(CancellationToken ct = default);
}
