using MSCompanion.Api.Dto;

namespace MSCompanion.Api.Interfaces;

public interface IAuthService
{
    /// <returns>The new session, or null if the email is already registered.</returns>
    Task<AuthResponse?> RegisterAsync(RegisterRequest request, CancellationToken ct = default);

    /// <returns>The new session, or null if the credentials are invalid or the account is inactive.</returns>
    Task<AuthResponse?> LoginAsync(LoginRequest request, CancellationToken ct = default);

    /// <returns>
    /// A new access token and refresh token (the old refresh token stops working), or null if the
    /// refresh token is invalid, already used, or its session has ended.
    /// </returns>
    Task<AuthResponse?> RefreshAsync(RefreshRequest request, CancellationToken ct = default);

    /// <summary>Ends the session: its access token and refresh token stop working immediately.</summary>
    Task LogoutAsync(Guid sessionId, CancellationToken ct = default);

    Task<UserDto?> GetUserAsync(Guid userId, CancellationToken ct = default);

    Task<ServiceResult<bool>> DeleteAccountAsync(Guid userId, string password, CancellationToken ct = default);
}
