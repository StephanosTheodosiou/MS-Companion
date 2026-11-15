namespace MSCompanion.Data.Models;

/// <summary>
/// Base class for entities that track when they were created/updated.
/// The timestamps are set automatically in <see cref="AppDbContext"/> on SaveChanges (always UTC).
/// </summary>
public abstract class AuditableEntity
{
    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }
}
