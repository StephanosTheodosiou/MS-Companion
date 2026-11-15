using System.ComponentModel.DataAnnotations;

namespace MSCompanion.Api.Dto;

public sealed class RefreshRequest
{
    /// <summary>The refresh token from the last login or refresh response. Each one can be used only once.</summary>
    [Required, MaxLength(200)]
    public required string RefreshToken { get; init; }
}
