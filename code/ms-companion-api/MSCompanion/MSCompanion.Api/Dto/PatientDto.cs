using MSCompanion.Data.Models;
using MSCompanion.Domain.Enums;

namespace MSCompanion.Api.Dto;

/// <summary>The signed-in user's health profile. Every field except <see cref="TimeZone"/> may be null.</summary>
public sealed class PatientDto
{
    public required Guid Id { get; init; }

    public string? PreferredName { get; init; }

    /// <summary>"yyyy-MM-dd".</summary>
    public DateOnly? DateOfBirth { get; init; }

    public MsType? MsType { get; init; }

    public short? DiagnosisYear { get; init; }

    public string? MsTeamName { get; init; }

    public string? MsTeamPhone { get; init; }

    /// <summary>IANA time zone, e.g. "Europe/Nicosia".</summary>
    public required string TimeZone { get; init; }

    /// <summary>When the profile was last changed (UTC).</summary>
    public required DateTimeOffset UpdatedAt { get; init; }

    public static PatientDto FromEntity(Patient patient) => new()
    {
        Id = patient.Id,
        PreferredName = patient.PreferredName,
        DateOfBirth = patient.DateOfBirth,
        MsType = patient.MsType,
        DiagnosisYear = patient.DiagnosisYear,
        MsTeamName = patient.MsTeamName,
        MsTeamPhone = patient.MsTeamPhone,
        TimeZone = patient.TimeZone,
        UpdatedAt = patient.UpdatedAt,
    };
}
