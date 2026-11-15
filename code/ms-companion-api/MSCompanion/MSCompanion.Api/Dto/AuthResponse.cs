namespace MSCompanion.Api.Dto;

/// <summary>Returned by register and login. The app stores <see cref="Token"/> and sends it as a Bearer token.</summary>
public sealed class AuthResponse
{
    public required string Token { get; init; }

    public required DateTime ExpiresAt { get; init; }

    public required UserDto User { get; init; }
}
