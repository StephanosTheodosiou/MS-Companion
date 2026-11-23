using System.ComponentModel.DataAnnotations;
using MSCompanion.Data.Models;
using MSCompanion.Domain.Rules;

namespace MSCompanion.Api.Dto;

public sealed class VisitQuestionDto
{
    public required Guid Id { get; init; }
    public Guid? AppointmentId { get; init; }
    public required string Text { get; init; }
    public required bool Asked { get; init; }
    public string? AnswerNote { get; init; }
    public required DateTimeOffset CreatedAt { get; init; }
    public required DateTimeOffset UpdatedAt { get; init; }

    public static VisitQuestionDto FromEntity(VisitQuestion q) => new()
    {
        Id = q.Id,
        AppointmentId = q.AppointmentId,
        Text = q.Text,
        Asked = q.Asked,
        AnswerNote = q.AnswerNote,
        CreatedAt = q.CreatedAt,
        UpdatedAt = q.UpdatedAt,
    };
}

public sealed class SaveVisitQuestionRequest : IValidatableObject
{
    public Guid? AppointmentId { get; init; }

    [Required, MaxLength(VisitQuestionRules.TextMaxLength)]
    public required string Text { get; init; }

    public bool Asked { get; init; }

    [MaxLength(VisitQuestionRules.AnswerNoteMaxLength)]
    public string? AnswerNote { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (string.IsNullOrWhiteSpace(Text))
        {
            yield return new ValidationResult("Write the question.", [nameof(Text)]);
        }

        if (!VisitQuestionRules.AnswerFitsAsked(Asked, AnswerNote))
        {
            yield return new ValidationResult("Only an asked question can have an answer note.", [nameof(AnswerNote)]);
        }
    }
}
