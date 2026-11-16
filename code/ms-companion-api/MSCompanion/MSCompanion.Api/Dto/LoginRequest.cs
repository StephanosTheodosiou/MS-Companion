using System.ComponentModel.DataAnnotations;

namespace MSCompanion.Api.Dto;

public sealed class LoginRequest
{
    [Required, EmailAddress, MaxLength(256)]
    public required string Email { get; init; }

    [Required, MaxLength(128)]
    public required string Password { get; init; }

    /// <summary>When true, the response also contains a refresh token so the app can stay signed in.</summary>
    public bool RememberMe { get; init; }
}
