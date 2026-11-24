using MSCompanion.Data.Models;

namespace MSCompanion.Data.Interfaces;

public interface IBloodTestRepository
{
    Task<List<BloodTestReminder>> GetAllAsync(Guid patientId, Guid? medicationId, CancellationToken ct = default);

    Task<BloodTestReminder?> GetAsync(Guid patientId, Guid reminderId, CancellationToken ct = default);

    Task<Medication?> FindMedicationAsync(Guid patientId, Guid medicationId, CancellationToken ct = default);

    void Add(BloodTestReminder reminder);

    Task SaveChangesAsync(CancellationToken ct = default);
}
