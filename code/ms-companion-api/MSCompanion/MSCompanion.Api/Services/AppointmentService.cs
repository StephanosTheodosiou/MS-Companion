using MSCompanion.Api.Dto;
using MSCompanion.Api.Interfaces;
using MSCompanion.Data.Interfaces;
using MSCompanion.Data.Models;
using MSCompanion.Domain.Enums;

namespace MSCompanion.Api.Services;

public sealed class AppointmentService(
    IPatientRepository patients,
    IAppointmentRepository appointments,
    IConsentService consents,
    TimeProvider clock) : IAppointmentService
{
    public async Task<ServiceResult<List<AppointmentDto>>> GetAllAsync(
        Guid userId,
        DateTimeOffset? from,
        DateTimeOffset? to,
        CancellationToken ct = default)
    {
        if (await patients.GetIdByUserIdAsync(userId, ct) is not { } patientId)
        {
            return ServiceError.PatientNotFound;
        }

        var list = await appointments.GetAllAsync(patientId, from?.ToUniversalTime(), to?.ToUniversalTime(), ct);
        return list.Select(AppointmentDto.FromEntity).ToList();
    }

    public async Task<ServiceResult<AppointmentDto>> GetAsync(Guid userId, Guid appointmentId, CancellationToken ct = default)
    {
        if (await patients.GetIdByUserIdAsync(userId, ct) is not { } patientId)
        {
            return ServiceError.PatientNotFound;
        }

        var appointment = await appointments.GetAsync(patientId, appointmentId, ct);
        return appointment is null ? ServiceError.NotFound : AppointmentDto.FromEntity(appointment);
    }

    public async Task<ServiceResult<AppointmentDto>> CreateAsync(
        Guid userId,
        SaveAppointmentRequest request,
        CancellationToken ct = default)
    {
        var (patientId, error) = await PatientForWriteAsync(userId, ct);
        if (error is not null)
        {
            return error.Value;
        }

        var appointment = new Appointment { Id = Guid.CreateVersion7(), PatientId = patientId };
        Apply(appointment, request);
        appointments.Add(appointment);
        await appointments.SaveChangesAsync(ct);

        return AppointmentDto.FromEntity(appointment);
    }

    public async Task<ServiceResult<AppointmentDto>> UpdateAsync(
        Guid userId,
        Guid appointmentId,
        SaveAppointmentRequest request,
        CancellationToken ct = default)
    {
        var (patientId, error) = await PatientForWriteAsync(userId, ct);
        if (error is not null)
        {
            return error.Value;
        }

        if (await appointments.GetAsync(patientId, appointmentId, ct) is not { } appointment)
        {
            return ServiceError.NotFound;
        }

        Apply(appointment, request);
        appointment.UpdatedAt = clock.GetUtcNow();
        await appointments.SaveChangesAsync(ct);

        return AppointmentDto.FromEntity(appointment);
    }

    public async Task<ServiceResult<bool>> DeleteAsync(Guid userId, Guid appointmentId, CancellationToken ct = default)
    {
        if (await patients.GetIdByUserIdAsync(userId, ct) is not { } patientId)
        {
            return ServiceError.PatientNotFound;
        }

        if (await appointments.GetAsync(patientId, appointmentId, ct) is not { } appointment)
        {
            return ServiceError.NotFound;
        }

        var now = clock.GetUtcNow();
        appointment.DeletedAt = now;
        appointment.UpdatedAt = now;

        foreach (var question in appointment.Questions)
        {
            question.AppointmentId = null;
            question.UpdatedAt = now;
        }

        await appointments.SaveChangesAsync(ct);
        return true;
    }

    private async Task<(Guid PatientId, ServiceError? Error)> PatientForWriteAsync(Guid userId, CancellationToken ct)
    {
        if (await patients.GetIdByUserIdAsync(userId, ct) is not { } patientId)
        {
            return (Guid.Empty, ServiceError.PatientNotFound);
        }

        return await consents.IsGrantedAsync(patientId, ConsentDataType.SymptomCheckins, ct)
            ? (patientId, null)
            : (patientId, ServiceError.ConsentRequired);
    }

    private static void Apply(Appointment target, SaveAppointmentRequest source)
    {
        target.StartsAt = source.StartsAt!.Value.ToUniversalTime();
        target.EndsAt = source.EndsAt?.ToUniversalTime();
        target.Status = source.Status;
        target.Type = source.Type!.Value;
        target.ClinicianName = Clean(source.ClinicianName);
        target.Location = Clean(source.Location);
        target.Note = Clean(source.Note);
    }

    private static string? Clean(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
