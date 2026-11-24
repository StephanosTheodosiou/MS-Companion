using MSCompanion.Api.Dto;

namespace MSCompanion.Api.Interfaces;

public interface ISideEffectService
{
    Task<ServiceResult<List<SideEffectDto>>> GetAllAsync(
        Guid userId,
        Guid? medicationId,
        bool? ongoing,
        CancellationToken ct = default);

    Task<ServiceResult<SideEffectDto>> GetAsync(Guid userId, Guid sideEffectId, CancellationToken ct = default);

    Task<ServiceResult<SideEffectDto>> CreateAsync(
        Guid userId,
        SaveSideEffectRequest request,
        CancellationToken ct = default);

    Task<ServiceResult<SideEffectDto>> UpdateAsync(
        Guid userId,
        Guid sideEffectId,
        SaveSideEffectRequest request,
        CancellationToken ct = default);

    Task<ServiceResult<bool>> DeleteAsync(Guid userId, Guid sideEffectId, CancellationToken ct = default);
}
