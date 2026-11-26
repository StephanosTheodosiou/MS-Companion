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

    Task<T?> FindAsync<T>(Guid id, CancellationToken ct = default)
        where T : PatientOwnedEntity;

    void Add<T>(T entity)
        where T : PatientOwnedEntity;

    Task<MedicationIntake?> FindLiveIntakeForSlotAsync(
        Guid scheduleId,
        DateTimeOffset scheduledFor,
        CancellationToken ct = default);

    Task<List<PatientOwnedEntity>> GetLiveMedicationChildrenAsync(Guid medicationId, CancellationToken ct = default);

    Task<List<VisitQuestion>> GetLiveQuestionsForAppointmentAsync(Guid appointmentId, CancellationToken ct = default);

    Task<IReadOnlyList<T>> GetChangedAsync<T>(
        Guid patientId,
        DateTimeOffset? afterServerUpdatedAt,
        Guid afterId,
        DateTimeOffset settledBefore,
        int take,
        CancellationToken ct = default)
        where T : PatientOwnedEntity;

    Task<Dictionary<Type, DateTimeOffset>> GetPurgeMarksAsync(Guid patientId, CancellationToken ct = default);

    Task<IReadOnlyList<CheckIn>> GetCheckInsChangedAsync(
        Guid patientId,
        DateTimeOffset? afterServerUpdatedAt,
        Guid afterId,
        DateTimeOffset settledBefore,
        int take,
        CancellationToken ct = default);
}
