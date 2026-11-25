using MSCompanion.Api.Dto;

namespace MSCompanion.Api.Interfaces;

public interface IVisitReportService
{
    Task<ServiceResult<VisitReportDto>> CreateAsync(
        Guid userId,
        CreateVisitReportRequest request,
        CancellationToken ct = default);

    Task<ServiceResult<List<VisitReportListItemDto>>> GetAllAsync(Guid userId, CancellationToken ct = default);

    Task<ServiceResult<VisitReportDto>> GetAsync(Guid userId, Guid reportId, CancellationToken ct = default);
}
