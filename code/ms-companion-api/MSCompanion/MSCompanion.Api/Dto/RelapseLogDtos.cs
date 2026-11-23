using System.ComponentModel.DataAnnotations;
using MSCompanion.Data.Models;
using MSCompanion.Domain.Enums;
using MSCompanion.Domain.Rules;

namespace MSCompanion.Api.Dto;

public sealed class RelapseLogEntryDto
{
    public required Guid Id { get; init; }
    public required string SymptomDescription { get; init; }
    public string? BodyArea { get; init; }
    public required DateOnly OnsetDate { get; init; }
    public required bool LastedOver24Hours { get; init; }
    public bool? HadFever { get; init; }
    public bool? HeatExposure { get; init; }
    public required RelapseGuidance GuidanceShown { get; init; }
    public required bool ContactedMsTeam { get; init; }
    public DateOnly? ResolvedOn { get; init; }
    public string? Note { get; init; }
    public required DateTimeOffset CreatedAt { get; init; }
    public required DateTimeOffset UpdatedAt { get; init; }

    public static RelapseLogEntryDto FromEntity(RelapseLogEntry e) => new()
    {
        Id = e.Id,
        SymptomDescription = e.SymptomDescription,
        BodyArea = e.BodyArea,
        OnsetDate = e.OnsetDate,
        LastedOver24Hours = e.LastedOver24Hours,
        HadFever = e.HadFever,
        HeatExposure = e.HeatExposure,
        GuidanceShown = e.GuidanceShown,
        ContactedMsTeam = e.ContactedMsTeam,
        ResolvedOn = e.ResolvedOn,
        Note = e.Note,
        CreatedAt = e.CreatedAt,
        UpdatedAt = e.UpdatedAt,
    };
}

public sealed class SaveRelapseLogEntryRequest : IValidatableObject
{
    [Required, MaxLength(500)]
    public required string SymptomDescription { get; init; }

    [MaxLength(100)]
    public string? BodyArea { get; init; }

    [Required]
    public DateOnly? OnsetDate { get; init; }

    [Required]
    public bool? LastedOver24Hours { get; init; }

    public bool? HadFever { get; init; }

    public bool? HeatExposure { get; init; }

    [Required]
    public RelapseGuidance? GuidanceShown { get; init; }

    public bool ContactedMsTeam { get; init; }

    public DateOnly? ResolvedOn { get; init; }

    [MaxLength(1000)]
    public string? Note { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (string.IsNullOrWhiteSpace(SymptomDescription))
        {
            yield return new ValidationResult("Describe the symptom.", [nameof(SymptomDescription)]);
        }

        // One day of slack for patients ahead of UTC.
        var latest = DateOnly.FromDateTime(DateTime.UtcNow).AddDays(1);
        if (OnsetDate > latest)
        {
            yield return new ValidationResult("Onset date cannot be in the future.", [nameof(OnsetDate)]);
        }

        if (ResolvedOn is { } resolved && (resolved < OnsetDate || resolved > latest))
        {
            yield return new ValidationResult(
                "Resolved date must be between the onset date and today.", [nameof(ResolvedOn)]);
        }

        if (LastedOver24Hours is { } lasted
            && GuidanceShown is { } shown
            && shown != RelapseGuidanceRule.For(lasted, HadFever, HeatExposure))
        {
            yield return new ValidationResult(
                "The guidance does not match the answers.", [nameof(GuidanceShown)]);
        }
    }
}
