using MSCompanion.Api.Dto;

namespace MSCompanion.Api.Interfaces;

public interface IAppointmentService
{
    Task<ServiceResult<List<AppointmentDto>>> GetAllAsync(
        Guid userId,
        DateTimeOffset? from,
        DateTimeOffset? to,
        CancellationToken ct = default);

    Task<ServiceResult<AppointmentDto>> GetAsync(Guid userId, Guid appointmentId, CancellationToken ct = default);

    Task<ServiceResult<AppointmentDto>> CreateAsync(
        Guid userId,
        SaveAppointmentRequest request,
        CancellationToken ct = default);

    Task<ServiceResult<AppointmentDto>> UpdateAsync(
        Guid userId,
        Guid appointmentId,
        SaveAppointmentRequest request,
        CancellationToken ct = default);

    Task<ServiceResult<bool>> DeleteAsync(Guid userId, Guid appointmentId, CancellationToken ct = default);
}
