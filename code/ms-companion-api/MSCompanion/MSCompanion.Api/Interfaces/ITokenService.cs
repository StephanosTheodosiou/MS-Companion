using MSCompanion.Data.Models;

namespace MSCompanion.Api.Interfaces;

public sealed record AccessToken(string Token, DateTime ExpiresAt);

public interface ITokenService
{
    /// <param name="sessionId">Written to the "sid" claim; the token is only accepted while that session is active.</param>
    AccessToken CreateToken(User user, Guid sessionId);
}
