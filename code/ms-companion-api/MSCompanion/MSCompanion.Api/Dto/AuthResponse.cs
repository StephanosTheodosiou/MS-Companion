namespace MSCompanion.Api.Dto;

/// <summary>
/// Returned by register, login and refresh. The app sends <see cref="Token"/> as a Bearer token.
/// With "remember me" it also stores <see cref="RefreshToken"/> (in secure storage) and calls
/// POST /api/auth/refresh shortly before <see cref="ExpiresAt"/> to get a new pair.
/// </summary>
public sealed class AuthResponse
{
    public required string Token { get; init; }

    /// <summary>When the access token expires (UTC).</summary>
    public required DateTime ExpiresAt { get; init; }

    /// <summary>Null unless "remember me" was chosen. Replaced on every refresh: always store the newest one.</summary>
    public string? RefreshToken { get; init; }

    /// <summary>When the session ends if it is not refreshed before then (UTC). Null without "remember me".</summary>
    public DateTimeOffset? RefreshTokenExpiresAt { get; init; }

    public required UserDto User { get; init; }
}
