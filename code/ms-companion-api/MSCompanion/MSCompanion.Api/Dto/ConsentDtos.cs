using System.ComponentModel.DataAnnotations;
using MSCompanion.Data.Models;
using MSCompanion.Domain.Enums;

namespace MSCompanion.Api.Dto;

/// <summary>The current choice for one data type (what the Settings screen shows).</summary>
public sealed class ConsentStateDto
{
    public required ConsentDataType DataType { get; init; }

    /// <summary>False also when the patient has never decided (<see cref="DecidedAt"/> is then null).</summary>
    public required bool Granted { get; init; }

    public string? PolicyVersion { get; init; }

    /// <summary>When the current choice was made (UTC). Null if the patient never decided.</summary>
    public DateTimeOffset? DecidedAt { get; init; }
}

/// <summary>One past decision, as stored (GDPR evidence).</summary>
public sealed class ConsentRecordDto
{
    public required Guid Id { get; init; }

    public required ConsentDataType DataType { get; init; }

    public required bool Granted { get; init; }

    public required string PolicyVersion { get; init; }

    public required DateTimeOffset DecidedAt { get; init; }

    public static ConsentRecordDto FromEntity(ConsentRecord record) => new()
    {
        Id = record.Id,
        DataType = record.DataType,
        Granted = record.Granted,
        PolicyVersion = record.PolicyVersion,
        DecidedAt = record.CreatedAt,
    };
}

public sealed class ConsentDecisionRequest
{
    /// <summary>"SymptomCheckins", "Medication", "Reminders", "Location", "FunctionTests", "PassiveSensing" or "CaregiverSharing".</summary>
    [Required]
    public ConsentDataType? DataType { get; init; }

    [Required]
    public bool? Granted { get; init; }
}

/// <summary>
/// One or more consent choices, e.g. everything from the onboarding consent screen in one call.
/// Each decision is stored as a new row; nothing is overwritten.
/// </summary>
public sealed class RecordConsentRequest : IValidatableObject
{
    /// <summary>Version of the consent text the patient saw, e.g. "2026-11-v1".</summary>
    [Required, MaxLength(32)]
    public required string PolicyVersion { get; init; }

    [Required, MinLength(1), MaxLength(20)]
    public required List<ConsentDecisionRequest> Decisions { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        var types = Decisions.Where(d => d.DataType is not null).Select(d => d.DataType!.Value).ToList();
        if (types.Count != types.Distinct().Count())
        {
            yield return new ValidationResult(
                "Each data type may appear only once per request.", [nameof(Decisions)]);
        }

        // Check-ins are what the app is for: the onboarding screen shows them as "Always on".
        // To stop them, the patient deletes their data (account deletion), not withdraws consent here.
        if (Decisions.Any(d => d.DataType == ConsentDataType.SymptomCheckins && d.Granted == false))
        {
            yield return new ValidationResult(
                "Consent for symptom check-ins is required to use the app. To stop, delete your data instead.",
                [nameof(Decisions)]);
        }
    }
}
