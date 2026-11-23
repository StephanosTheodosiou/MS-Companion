using MSCompanion.Data.Models;

namespace MSCompanion.Data.Interfaces;

public interface IVisitQuestionRepository
{
    Task<List<VisitQuestion>> GetAllAsync(
        Guid patientId,
        bool? asked,
        Guid? appointmentId,
        CancellationToken ct = default);

    Task<VisitQuestion?> GetAsync(Guid patientId, Guid questionId, CancellationToken ct = default);

    Task<bool> AppointmentExistsAsync(Guid patientId, Guid appointmentId, CancellationToken ct = default);

    void Add(VisitQuestion question);

    Task SaveChangesAsync(CancellationToken ct = default);
}
