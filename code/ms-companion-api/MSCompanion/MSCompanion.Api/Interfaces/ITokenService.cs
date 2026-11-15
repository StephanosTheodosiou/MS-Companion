using MSCompanion.Data.Models;

namespace MSCompanion.Api.Interfaces;

public sealed record AccessToken(string Token, DateTime ExpiresAt);

public interface ITokenService
{
    AccessToken CreateToken(User user);
}
