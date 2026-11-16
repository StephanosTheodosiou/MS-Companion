using MSCompanion.Api.Dto;

namespace MSCompanion.Api.Interfaces;

public interface IPatientService
{
    /// <returns>The profile, or null if the user has no patient record.</returns>
    Task<PatientDto?> GetProfileAsync(Guid userId, CancellationToken ct = default);

    /// <returns>The updated profile, or null if the user has no patient record.</returns>
    Task<PatientDto?> UpdateProfileAsync(Guid userId, UpdatePatientRequest request, CancellationToken ct = default);
}
