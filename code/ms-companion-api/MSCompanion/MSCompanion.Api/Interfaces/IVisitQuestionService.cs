using MSCompanion.Api.Dto;

namespace MSCompanion.Api.Interfaces;

public interface IVisitQuestionService
{
    Task<ServiceResult<List<VisitQuestionDto>>> GetAllAsync(
        Guid userId,
        bool? asked,
        Guid? appointmentId,
        CancellationToken ct = default);

    Task<ServiceResult<VisitQuestionDto>> GetAsync(Guid userId, Guid questionId, CancellationToken ct = default);

    Task<ServiceResult<VisitQuestionDto>> CreateAsync(
        Guid userId,
        SaveVisitQuestionRequest request,
        CancellationToken ct = default);

    Task<ServiceResult<VisitQuestionDto>> UpdateAsync(
        Guid userId,
        Guid questionId,
        SaveVisitQuestionRequest request,
        CancellationToken ct = default);

    Task<ServiceResult<bool>> DeleteAsync(Guid userId, Guid questionId, CancellationToken ct = default);
}
