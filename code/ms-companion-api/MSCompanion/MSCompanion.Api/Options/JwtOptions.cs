using System.ComponentModel.DataAnnotations;

namespace MSCompanion.Api.Options;

/// <summary>
/// Bound from the "Jwt" configuration section and validated at startup.
/// <see cref="Key"/> is a secret: set it with `dotnet user-secrets` (see README), never in appsettings.json.
/// </summary>
public sealed class JwtOptions
{
    public const string SectionName = "Jwt";

    [Required]
    public string Issuer { get; init; } = string.Empty;

    [Required]
    public string Audience { get; init; } = string.Empty;

    /// <summary>HMAC-SHA256 signing key. Must be at least 32 characters.</summary>
    [Required, MinLength(32)]
    public string Key { get; init; } = string.Empty;

    [Range(1, 1440)]
    public int ExpiresMinutes { get; init; } = 60;
}
