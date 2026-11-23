using MSCompanion.Api.Dto;

namespace MSCompanion.Api.Interfaces;

public interface IRelapseLogService
{
    Task<ServiceResult<List<RelapseLogEntryDto>>> GetAllAsync(Guid userId, CancellationToken ct = default);

    Task<ServiceResult<RelapseLogEntryDto>> GetAsync(Guid userId, Guid entryId, CancellationToken ct = default);

    Task<ServiceResult<RelapseLogEntryDto>> CreateAsync(
        Guid userId,
        SaveRelapseLogEntryRequest request,
        CancellationToken ct = default);

    Task<ServiceResult<RelapseLogEntryDto>> UpdateAsync(
        Guid userId,
        Guid entryId,
        SaveRelapseLogEntryRequest request,
        CancellationToken ct = default);

    Task<ServiceResult<bool>> DeleteAsync(Guid userId, Guid entryId, CancellationToken ct = default);
}
