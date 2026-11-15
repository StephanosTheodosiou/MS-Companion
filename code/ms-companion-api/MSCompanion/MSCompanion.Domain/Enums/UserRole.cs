namespace MSCompanion.Domain.Enums;

/// <summary>
/// Authorization roles. Stored as text in the database, and issued as the "role" claim in the JWT,
/// so they can be used with <c>[Authorize(Roles = nameof(UserRole.Admin))]</c>.
/// </summary>
public enum UserRole
{
    User = 0,
    Admin = 1,
}
