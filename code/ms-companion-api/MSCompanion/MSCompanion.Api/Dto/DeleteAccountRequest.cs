using System.ComponentModel.DataAnnotations;

namespace MSCompanion.Api.Dto;

public sealed class DeleteAccountRequest
{
    [Required, MaxLength(128)]
    public required string Password { get; init; }
}
