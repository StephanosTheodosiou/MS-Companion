using MSCompanion.Api.Dto;
using MSCompanion.Api.Interfaces;
using MSCompanion.Data.Interfaces;
using MSCompanion.Data.Models;
using MSCompanion.Domain.Enums;

namespace MSCompanion.Api.Services;

public sealed class VisitQuestionService(
    IPatientRepository patients,
    IVisitQuestionRepository questions,
    IConsentService consents,
    TimeProvider clock) : IVisitQuestionService
{
    public async Task<ServiceResult<List<VisitQuestionDto>>> GetAllAsync(
        Guid userId,
        bool? asked,
        Guid? appointmentId,
        CancellationToken ct = default)
    {
        if (await patients.GetIdByUserIdAsync(userId, ct) is not { } patientId)
        {
            return ServiceError.PatientNotFound;
        }

        var list = await questions.GetAllAsync(patientId, asked, appointmentId, ct);
        return list.Select(VisitQuestionDto.FromEntity).ToList();
    }

    public async Task<ServiceResult<VisitQuestionDto>> GetAsync(Guid userId, Guid questionId, CancellationToken ct = default)
    {
        if (await patients.GetIdByUserIdAsync(userId, ct) is not { } patientId)
        {
            return ServiceError.PatientNotFound;
        }

        var question = await questions.GetAsync(patientId, questionId, ct);
        return question is null ? ServiceError.NotFound : VisitQuestionDto.FromEntity(question);
    }

    public async Task<ServiceResult<VisitQuestionDto>> CreateAsync(
        Guid userId,
        SaveVisitQuestionRequest request,
        CancellationToken ct = default)
    {
        var (patientId, error) = await PatientForWriteAsync(userId, request.AppointmentId, ct);
        if (error is not null)
        {
            return error.Value;
        }

        var question = new VisitQuestion { Id = Guid.CreateVersion7(), PatientId = patientId, Text = "" };
        Apply(question, request);
        questions.Add(question);
        await questions.SaveChangesAsync(ct);

        return VisitQuestionDto.FromEntity(question);
    }

    public async Task<ServiceResult<VisitQuestionDto>> UpdateAsync(
        Guid userId,
        Guid questionId,
        SaveVisitQuestionRequest request,
        CancellationToken ct = default)
    {
        var (patientId, error) = await PatientForWriteAsync(userId, request.AppointmentId, ct);
        if (error is not null)
        {
            return error.Value;
        }

        if (await questions.GetAsync(patientId, questionId, ct) is not { } question)
        {
            return ServiceError.NotFound;
        }

        Apply(question, request);
        question.UpdatedAt = clock.GetUtcNow();
        await questions.SaveChangesAsync(ct);

        return VisitQuestionDto.FromEntity(question);
    }

    public async Task<ServiceResult<bool>> DeleteAsync(Guid userId, Guid questionId, CancellationToken ct = default)
    {
        if (await patients.GetIdByUserIdAsync(userId, ct) is not { } patientId)
        {
            return ServiceError.PatientNotFound;
        }

        if (await questions.GetAsync(patientId, questionId, ct) is not { } question)
        {
            return ServiceError.NotFound;
        }

        var now = clock.GetUtcNow();
        question.DeletedAt = now;
        question.UpdatedAt = now;
        await questions.SaveChangesAsync(ct);

        return true;
    }

    private async Task<(Guid PatientId, ServiceError? Error)> PatientForWriteAsync(
        Guid userId,
        Guid? appointmentId,
        CancellationToken ct)
    {
        if (await patients.GetIdByUserIdAsync(userId, ct) is not { } patientId)
        {
            return (Guid.Empty, ServiceError.PatientNotFound);
        }

        if (!await consents.IsGrantedAsync(patientId, ConsentDataType.SymptomCheckins, ct))
        {
            return (patientId, ServiceError.ConsentRequired);
        }

        if (appointmentId is { } id && !await questions.AppointmentExistsAsync(patientId, id, ct))
        {
            return (patientId, ServiceError.NotFound);
        }

        return (patientId, null);
    }

    private static void Apply(VisitQuestion target, SaveVisitQuestionRequest source)
    {
        target.AppointmentId = source.AppointmentId;
        target.Text = source.Text.Trim();
        target.Asked = source.Asked;
        target.AnswerNote = string.IsNullOrWhiteSpace(source.AnswerNote) ? null : source.AnswerNote.Trim();
    }
}
