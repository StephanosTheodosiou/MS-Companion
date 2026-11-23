using System.ComponentModel.DataAnnotations;
using MSCompanion.Data.Models;
using MSCompanion.Domain.Enums;
using MSCompanion.Domain.Rules;

namespace MSCompanion.Api.Dto;

public sealed class AppointmentDto
{
    public required Guid Id { get; init; }
    public required DateTimeOffset StartsAt { get; init; }
    public DateTimeOffset? EndsAt { get; init; }
    public required AppointmentStatus Status { get; init; }
    public required AppointmentType Type { get; init; }
    public string? ClinicianName { get; init; }
    public string? Location { get; init; }
    public string? Note { get; init; }
    public required DateTimeOffset CreatedAt { get; init; }
    public required DateTimeOffset UpdatedAt { get; init; }

    public static AppointmentDto FromEntity(Appointment a) => new()
    {
        Id = a.Id,
        StartsAt = a.StartsAt,
        EndsAt = a.EndsAt,
        Status = a.Status,
        Type = a.Type,
        ClinicianName = a.ClinicianName,
        Location = a.Location,
        Note = a.Note,
        CreatedAt = a.CreatedAt,
        UpdatedAt = a.UpdatedAt,
    };
}

public sealed class SaveAppointmentRequest : IValidatableObject
{
    [Required]
    public DateTimeOffset? StartsAt { get; init; }

    public DateTimeOffset? EndsAt { get; init; }

    public AppointmentStatus Status { get; init; } = AppointmentStatus.Booked;

    [Required]
    public AppointmentType? Type { get; init; }

    [MaxLength(AppointmentRules.ClinicianNameMaxLength)]
    public string? ClinicianName { get; init; }

    [MaxLength(AppointmentRules.LocationMaxLength)]
    public string? Location { get; init; }

    [MaxLength(AppointmentRules.NoteMaxLength)]
    public string? Note { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (StartsAt is not { } start)
        {
            yield break;
        }

        if (!AppointmentRules.EndsAfterStart(start, EndsAt))
        {
            yield return new ValidationResult("End time must be after the start time.", [nameof(EndsAt)]);
        }

        if (!AppointmentRules.StatusFitsTime(Status, start, DateTimeOffset.UtcNow))
        {
            yield return new ValidationResult(
                "An appointment that has not started yet cannot be Fulfilled or NoShow.", [nameof(Status)]);
        }
    }
}
