using System.ComponentModel.DataAnnotations;
using MSCompanion.Domain.Enums;

namespace MSCompanion.Api.Dto;

/// <summary>
/// Replaces the whole profile (PUT semantics): a field sent as null, or left out, is cleared.
/// Every field is optional (data minimisation) except <see cref="TimeZone"/>.
/// </summary>
public sealed class UpdatePatientRequest : IValidatableObject
{
    [MaxLength(100)]
    public string? PreferredName { get; init; }

    public DateOnly? DateOfBirth { get; init; }

    /// <summary>"RelapsingRemitting", "SecondaryProgressive", "PrimaryProgressive", "ClinicallyIsolatedSyndrome" or "NotSure".</summary>
    public MsType? MsType { get; init; }

    [Range(1950, 2100)]
    public short? DiagnosisYear { get; init; }

    [MaxLength(150)]
    public string? MsTeamName { get; init; }

    [MaxLength(30), Phone]
    public string? MsTeamPhone { get; init; }

    /// <summary>IANA time zone, e.g. "Europe/Nicosia".</summary>
    [Required, MaxLength(64)]
    public required string TimeZone { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        if (DateOfBirth is { } dob && (dob > today || dob.Year < 1900))
        {
            yield return new ValidationResult(
                "Date of birth must be in the past and after 1900.", [nameof(DateOfBirth)]);
        }

        if (DiagnosisYear is { } year && year > today.Year)
        {
            yield return new ValidationResult(
                "Diagnosis year cannot be in the future.", [nameof(DiagnosisYear)]);
        }

        if (DateOfBirth is { } born && DiagnosisYear is { } diagnosed && diagnosed < born.Year)
        {
            yield return new ValidationResult(
                "Diagnosis year cannot be before the year of birth.", [nameof(DiagnosisYear)]);
        }

        // Only IANA ids ("Europe/Nicosia"), not Windows ids ("GTB Standard Time"): the phone needs IANA.
        if (!string.IsNullOrWhiteSpace(TimeZone) && !TimeZoneInfo.TryConvertIanaIdToWindowsId(TimeZone.Trim(), out _))
        {
            yield return new ValidationResult(
                "Time zone must be an IANA time zone id, e.g. \"Europe/Nicosia\".", [nameof(TimeZone)]);
        }
    }
}
