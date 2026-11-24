using MSCompanion.Api.Dto;

namespace MSCompanion.Api.Interfaces;

public interface IBloodTestService
{
    Task<ServiceResult<List<BloodTestDto>>> GetAllAsync(
        Guid userId,
        BloodTestStatus? status,
        Guid? medicationId,
        CancellationToken ct = default);

    Task<ServiceResult<BloodTestDto>> GetAsync(Guid userId, Guid reminderId, CancellationToken ct = default);

    Task<ServiceResult<BloodTestDto>> CreateAsync(Guid userId, SaveBloodTestRequest request, CancellationToken ct = default);

    Task<ServiceResult<BloodTestDto>> UpdateAsync(
        Guid userId,
        Guid reminderId,
        SaveBloodTestRequest request,
        CancellationToken ct = default);

    Task<ServiceResult<CompleteBloodTestResponse>> CompleteAsync(
        Guid userId,
        Guid reminderId,
        CompleteBloodTestRequest request,
        CancellationToken ct = default);

    Task<ServiceResult<bool>> DeleteAsync(Guid userId, Guid reminderId, CancellationToken ct = default);
}
