using MSCompanion.Api.Dto;
using MSCompanion.Api.Interfaces;
using MSCompanion.Data.Interfaces;
using MSCompanion.Data.Models;

namespace MSCompanion.Api.Services;

public sealed class AuthService(IUserRepository users, ITokenService tokens) : IAuthService
{
    // Verified against when the email doesn't exist, so "unknown email" and "wrong password"
    // take the same time and attackers can't discover which emails are registered.
    private static readonly string DummyHash = BCrypt.Net.BCrypt.HashPassword("timing-equalizer");

    public async Task<AuthResponse?> RegisterAsync(RegisterRequest request, CancellationToken ct = default)
    {
        var user = new User
        {
            Email = NormalizeEmail(request.Email),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
        };

        return await users.TryAddAsync(user, ct) ? CreateSession(user) : null;
    }

    public async Task<AuthResponse?> LoginAsync(LoginRequest request, CancellationToken ct = default)
    {
        var user = await users.GetByEmailAsync(NormalizeEmail(request.Email), ct);

        var passwordOk = BCrypt.Net.BCrypt.Verify(request.Password, user?.PasswordHash ?? DummyHash);
        if (user is null || !passwordOk || !user.IsActive)
        {
            return null;
        }

        return CreateSession(user);
    }

    public async Task<UserDto?> GetUserAsync(Guid userId, CancellationToken ct = default)
    {
        var user = await users.GetByIdAsync(userId, ct);
        return user is null ? null : UserDto.FromEntity(user);
    }

    private AuthResponse CreateSession(User user)
    {
        var token = tokens.CreateToken(user);
        return new AuthResponse
        {
            Token = token.Token,
            ExpiresAt = token.ExpiresAt,
            User = UserDto.FromEntity(user),
        };
    }

    private static string NormalizeEmail(string email) => email.Trim().ToLowerInvariant();
}
