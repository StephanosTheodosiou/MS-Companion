namespace MSCompanion.Data.Models;

/// <summary>
/// Base class for every table that is written on the phone (SQLite, offline) and synced to the server.
///
/// Sync model (one phone per patient): last write wins.
///  - Push: the server applies an incoming row only if its <see cref="UpdatedAt"/> is newer than the stored one.
///  - Pull: the phone asks for rows with <see cref="ServerUpdatedAt"/> greater than its last sync cursor
///    (this includes soft-deleted rows, so deletions sync too).
///
/// All timestamps must be UTC (offset 0): Npgsql rejects any other offset. Convert at the API boundary.
/// </summary>
public abstract class SyncedEntity
{
    /// <summary>UUID generated on the phone, so rows can be created offline without clashes.</summary>
    public Guid Id { get; set; }

    /// <summary>When the row was first created on the device.</summary>
    public DateTimeOffset CreatedAt { get; set; }

    /// <summary>When the row was last changed on the device. Decides last-write-wins.</summary>
    public DateTimeOffset UpdatedAt { get; set; }

    /// <summary>Set by the server on every insert/update (see <see cref="AppDbContext"/>). Used as the pull cursor.</summary>
    public DateTimeOffset ServerUpdatedAt { get; set; }
}

/// <summary>Any row that belongs to exactly one patient. Used for authorisation and sync filtering.</summary>
public interface IPatientOwned
{
    Guid PatientId { get; }
}

/// <summary>
/// A patient's health record row that the patient can edit or delete.
/// Deleting sets <see cref="DeletedAt"/> (a "tombstone") so the deletion reaches the phone on the next sync.
/// Deleting the whole account (GDPR erasure) is a hard delete that cascades User → Patient → everything below.
/// </summary>
public abstract class PatientOwnedEntity : SyncedEntity, IPatientOwned
{
    public Guid PatientId { get; set; }

    public Patient Patient { get; set; } = null!;

    /// <summary>Null = live row. Rows with a value are hidden by a global query filter.</summary>
    public DateTimeOffset? DeletedAt { get; set; }
}
