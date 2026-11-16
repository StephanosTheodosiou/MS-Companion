using MSCompanion.Data.Models;

namespace MSCompanion.Api.Dto;

/// <summary>Public view of a user — never expose entities (e.g. PasswordHash) directly.</summary>
public sealed class UserDto
{
    public required Guid Id { get; init; }

    public required string Email { get; init; }

    public required string FirstName { get; init; }

    public required string LastName { get; init; }

    public required string Role { get; init; }

    public static UserDto FromEntity(User user) => new()
    {
        Id = user.Id,
        Email = user.Email,
        FirstName = user.FirstName,
        LastName = user.LastName,
        Role = user.Role.ToString(),
    };
}
