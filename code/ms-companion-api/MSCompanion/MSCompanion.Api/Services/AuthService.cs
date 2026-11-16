using System.Buffers.Text;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using MSCompanion.Api.Dto;
using MSCompanion.Api.Interfaces;
using MSCompanion.Api.Options;
using MSCompanion.Data.Interfaces;
using MSCompanion.Data.Models;

namespace MSCompanion.Api.Services;

public sealed class AuthService(
    IUserRepository users,
    ISessionRepository sessions,
    ITokenService tokens,
    IOptions<JwtOptions> jwtOptions,
    TimeProvider clock) : IAuthService
{
    // Verified against when the email doesn't exist, so "unknown email" and "wrong password"
    // take the same time and attackers can't discover which emails are registered.
    private static readonly string DummyHash = BCrypt.Net.BCrypt.HashPassword("timing-equalizer");

    private readonly JwtOptions _jwt = jwtOptions.Value;

    public async Task<AuthResponse?> RegisterAsync(RegisterRequest request, CancellationToken ct = default)
    {
        var user = new User
        {
            Email = NormalizeEmail(request.Email),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            // Every account starts with an empty health record; it is saved in the same transaction.
            // Profile fields are filled in later via PUT /api/patient/me.
            Patient = new Patient { Id = Guid.CreateVersion7() },
        };

        if (!await users.TryAddAsync(user, ct))
        {
            return null;
        }

        return await StartSessionAsync(user, request.RememberMe, ct);
    }

    public async Task<AuthResponse?> LoginAsync(LoginRequest request, CancellationToken ct = default)
    {
        var user = await users.GetByEmailAsync(NormalizeEmail(request.Email), ct);

        var passwordOk = BCrypt.Net.BCrypt.Verify(request.Password, user?.PasswordHash ?? DummyHash);
        if (user is null || !passwordOk || !user.IsActive)
        {
            return null;
        }

        return await StartSessionAsync(user, request.RememberMe, ct);
    }

    public async Task<AuthResponse?> RefreshAsync(RefreshRequest request, CancellationToken ct = default)
    {
        // Refresh token format: "<session id>.<random secret>".
        var parts = request.RefreshToken.Split('.', 2);
        if (parts.Length != 2 || !Guid.TryParseExact(parts[0], "N", out var sessionId))
        {
            return null;
        }

        var session = await sessions.GetWithUserAsync(sessionId, ct);
        var now = clock.GetUtcNow();
        if (session is null
            || !session.RememberMe
            || session.RefreshTokenHash is null
            || session.RevokedAt is not null
            || session.ExpiresAt <= now
            || !session.User.IsActive)
        {
            return null;
        }

        if (!HashMatches(parts[1], session.RefreshTokenHash))
        {
            // The session exists but this is not its current refresh token: an old, already-used token
            // was presented. Someone may have copied it, so end the session for safety.
            session.RevokedAt = now;
            await sessions.SaveChangesAsync(ct);
            return null;
        }

        // Rotate: issue a new refresh token (the presented one stops working) and extend the session.
        var refreshToken = NewRefreshSecret(session, now);
        await sessions.SaveChangesAsync(ct);

        return BuildResponse(session.User, session, refreshToken);
    }

    public async Task LogoutAsync(Guid sessionId, CancellationToken ct = default)
    {
        var session = await sessions.GetWithUserAsync(sessionId, ct);
        if (session is null || session.RevokedAt is not null)
        {
            return; // already logged out: logout is idempotent
        }

        session.RevokedAt = clock.GetUtcNow();
        session.RefreshTokenHash = null;
        await sessions.SaveChangesAsync(ct);
    }

    public async Task<UserDto?> GetUserAsync(Guid userId, CancellationToken ct = default)
    {
        var user = await users.GetByIdAsync(userId, ct);
        return user is null ? null : UserDto.FromEntity(user);
    }

    private async Task<AuthResponse> StartSessionAsync(User user, bool rememberMe, CancellationToken ct)
    {
        var now = clock.GetUtcNow();
        var session = new UserSession
        {
            UserId = user.Id,
            RememberMe = rememberMe,
            CreatedAt = now,
            // Without "remember me" the session lasts exactly as long as the access token.
            ExpiresAt = now.AddMinutes(_jwt.ExpiresMinutes),
        };

        var refreshToken = rememberMe ? NewRefreshSecret(session, now) : null;
        await sessions.AddAsync(session, ct);

        return BuildResponse(user, session, refreshToken);
    }

    /// <summary>Creates a new refresh token for the session, stores its hash and extends the session.</summary>
    private string NewRefreshSecret(UserSession session, DateTimeOffset now)
    {
        var secret = Base64Url.EncodeToString(RandomNumberGenerator.GetBytes(32));
        session.RefreshTokenHash = Hash(secret);
        session.ExpiresAt = now.AddDays(_jwt.RefreshTokenDays);
        if (session.CreatedAt != now)
        {
            session.LastRefreshedAt = now;
        }

        return $"{session.Id:N}.{secret}";
    }

    private AuthResponse BuildResponse(User user, UserSession session, string? refreshToken)
    {
        var token = tokens.CreateToken(user, session.Id);
        return new AuthResponse
        {
            Token = token.Token,
            ExpiresAt = token.ExpiresAt,
            RefreshToken = refreshToken,
            RefreshTokenExpiresAt = refreshToken is null ? null : session.ExpiresAt,
            User = UserDto.FromEntity(user),
        };
    }

    // Only a hash is stored, so a database leak does not expose usable refresh tokens.
    private static string Hash(string secret) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(secret)));

    private static bool HashMatches(string secret, string storedHash) =>
        CryptographicOperations.FixedTimeEquals(
            Encoding.ASCII.GetBytes(Hash(secret)),
            Encoding.ASCII.GetBytes(storedHash));

    private static string NormalizeEmail(string email) => email.Trim().ToLowerInvariant();
}
