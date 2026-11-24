using System.ComponentModel.DataAnnotations;
using MSCompanion.Data.Models;
using MSCompanion.Domain.Enums;
using MSCompanion.Domain.Rules;

namespace MSCompanion.Api.Dto;

public sealed class SideEffectDto
{
    public required Guid Id { get; init; }
    public Guid? MedicationId { get; init; }
    public string? MedicationName { get; init; }
    public required string Description { get; init; }
    public required SideEffectSeverity Severity { get; init; }
    public required DateOnly StartedOn { get; init; }
    public DateOnly? EndedOn { get; init; }
    public required bool Ongoing { get; init; }
    public string? Note { get; init; }
    public required DateTimeOffset CreatedAt { get; init; }
    public required DateTimeOffset UpdatedAt { get; init; }

    public static SideEffectDto FromEntity(SideEffect s) => new()
    {
        Id = s.Id,
        MedicationId = s.MedicationId,
        MedicationName = s.Medication?.Name,
        Description = s.Description,
        Severity = s.Severity,
        StartedOn = s.StartedOn,
        EndedOn = s.EndedOn,
        Ongoing = s.EndedOn is null,
        Note = s.Note,
        CreatedAt = s.CreatedAt,
        UpdatedAt = s.UpdatedAt,
    };
}

public sealed class SaveSideEffectRequest : IValidatableObject
{
    public Guid? MedicationId { get; init; }

    [Required, MaxLength(SideEffectRules.DescriptionMaxLength)]
    public required string Description { get; init; }

    [Required]
    public SideEffectSeverity? Severity { get; init; }

    [Required]
    public DateOnly? StartedOn { get; init; }

    public DateOnly? EndedOn { get; init; }

    [MaxLength(SideEffectRules.NoteMaxLength)]
    public string? Note { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (string.IsNullOrWhiteSpace(Description))
        {
            yield return new ValidationResult("Describe the side effect.", [nameof(Description)]);
        }

        var latest = DateOnly.FromDateTime(DateTime.UtcNow).AddDays(1);
        if (StartedOn is { } start && !SideEffectRules.DatesValid(start, EndedOn, latest))
        {
            yield return new ValidationResult(
                "Dates cannot be in the future, and the end date cannot be before the start date.",
                [nameof(StartedOn), nameof(EndedOn)]);
        }
    }
}
