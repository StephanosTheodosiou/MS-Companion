namespace MSCompanion.Data.Models;

/// <summary>
/// One signed-in device/login. Every access token carries the session id ("sid" claim) and is only
/// accepted while its session is active, so logging out takes effect immediately.
///
/// "Remember me" sessions also have a refresh token. Only its SHA-256 hash is stored; the token is
/// rotated (replaced) on every refresh, and each refresh extends <see cref="ExpiresAt"/>.
/// </summary>
public class UserSession
{
    /// <summary>Also the "sid" claim in the access token and the first part of the refresh token.</summary>
    public Guid Id { get; set; } = Guid.CreateVersion7();

    public Guid UserId { get; set; }

    public User User { get; set; } = null!;

    public bool RememberMe { get; set; }

    /// <summary>SHA-256 (hex) of the current refresh token secret. Null when <see cref="RememberMe"/> is off.</summary>
    public string? RefreshTokenHash { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    /// <summary>After this the session is over: no token from it is accepted and it cannot be refreshed.</summary>
    public DateTimeOffset ExpiresAt { get; set; }

    public DateTimeOffset? LastRefreshedAt { get; set; }

    /// <summary>Set on logout, or when a reused (stolen) refresh token is detected.</summary>
    public DateTimeOffset? RevokedAt { get; set; }
}
