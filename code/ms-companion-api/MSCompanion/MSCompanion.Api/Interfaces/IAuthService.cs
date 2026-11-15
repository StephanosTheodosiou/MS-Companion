using MSCompanion.Api.Dto;

namespace MSCompanion.Api.Interfaces;

public interface IAuthService
{
    /// <returns>The new session, or null if the email is already registered.</returns>
    Task<AuthResponse?> RegisterAsync(RegisterRequest request, CancellationToken ct = default);

    /// <returns>The new session, or null if the credentials are invalid or the account is inactive.</returns>
    Task<AuthResponse?> LoginAsync(LoginRequest request, CancellationToken ct = default);

    Task<UserDto?> GetUserAsync(Guid userId, CancellationToken ct = default);
}
