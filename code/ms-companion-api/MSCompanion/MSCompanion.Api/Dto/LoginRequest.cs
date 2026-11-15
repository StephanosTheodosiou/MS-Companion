using System.ComponentModel.DataAnnotations;

namespace MSCompanion.Api.Dto;

public sealed class LoginRequest
{
    [Required, EmailAddress, MaxLength(256)]
    public required string Email { get; init; }

    [Required, MaxLength(128)]
    public required string Password { get; init; }
}
