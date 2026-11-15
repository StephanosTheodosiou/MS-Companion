using MSCompanion.Domain.Enums;

namespace MSCompanion.Data.Models;

public class User : AuditableEntity
{
    /// <summary>Time-ordered GUID (v7): unique without a DB round-trip and index-friendly.</summary>
    public Guid Id { get; set; } = Guid.CreateVersion7();

    /// <summary>Always stored normalized (trimmed, lower-case). Unique.</summary>
    public required string Email { get; set; }

    /// <summary>BCrypt hash — never store or log the plain password.</summary>
    public required string PasswordHash { get; set; }

    public required string FirstName { get; set; }

    public required string LastName { get; set; }

    public UserRole Role { get; set; } = UserRole.User;

    public bool IsActive { get; set; } = true;
}
