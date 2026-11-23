using Microsoft.EntityFrameworkCore;
using MSCompanion.Data.Interfaces;
using MSCompanion.Data.Models;

namespace MSCompanion.Data.Repositories;

public class VisitQuestionRepository(AppDbContext context) : IVisitQuestionRepository
{
    public Task<List<VisitQuestion>> GetAllAsync(
        Guid patientId,
        bool? asked,
        Guid? appointmentId,
        CancellationToken ct = default)
    {
        var query = context.VisitQuestions.AsNoTracking().Where(q => q.PatientId == patientId);

        if (asked is { } value)
        {
            query = query.Where(q => q.Asked == value);
        }

        if (appointmentId is { } id)
        {
            query = query.Where(q => q.AppointmentId == id);
        }

        return query.OrderBy(q => q.Asked).ThenBy(q => q.CreatedAt).ToListAsync(ct);
    }

    public Task<VisitQuestion?> GetAsync(Guid patientId, Guid questionId, CancellationToken ct = default) =>
        context.VisitQuestions.FirstOrDefaultAsync(q => q.PatientId == patientId && q.Id == questionId, ct);

    public Task<bool> AppointmentExistsAsync(Guid patientId, Guid appointmentId, CancellationToken ct = default) =>
        context.Appointments.AnyAsync(a => a.PatientId == patientId && a.Id == appointmentId, ct);

    public void Add(VisitQuestion question) => context.VisitQuestions.Add(question);

    public Task SaveChangesAsync(CancellationToken ct = default) => context.SaveChangesAsync(ct);
}
