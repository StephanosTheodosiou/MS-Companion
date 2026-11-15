using MSCompanion.Api.Dto;
using MSCompanion.Api.Interfaces;
using MSCompanion.Data.Interfaces;

namespace MSCompanion.Api.Services;

public sealed class PatientService(IPatientRepository patients, TimeProvider time) : IPatientService
{
    public async Task<PatientDto?> GetProfileAsync(Guid userId, CancellationToken ct = default)
    {
        var patient = await patients.GetByUserIdAsync(userId, ct);
        return patient is null ? null : PatientDto.FromEntity(patient);
    }

    public async Task<PatientDto?> UpdateProfileAsync(
        Guid userId,
        UpdatePatientRequest request,
        CancellationToken ct = default)
    {
        var patient = await patients.GetByUserIdForUpdateAsync(userId, ct);
        if (patient is null)
        {
            return null;
        }

        patient.PreferredName = Clean(request.PreferredName);
        patient.DateOfBirth = request.DateOfBirth;
        patient.MsType = request.MsType;
        patient.DiagnosisYear = request.DiagnosisYear;
        patient.MsTeamName = Clean(request.MsTeamName);
        patient.MsTeamPhone = Clean(request.MsTeamPhone);
        patient.TimeZone = request.TimeZone.Trim();

        // Changed on the server, so the server clock is the "device" time for last-write-wins.
        // (ServerUpdatedAt, the sync cursor, is set by AppDbContext.)
        patient.UpdatedAt = time.GetUtcNow();

        await patients.SaveChangesAsync(ct);
        return PatientDto.FromEntity(patient);
    }

    /// <summary>Trims, and stores blank strings as null.</summary>
    private static string? Clean(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
