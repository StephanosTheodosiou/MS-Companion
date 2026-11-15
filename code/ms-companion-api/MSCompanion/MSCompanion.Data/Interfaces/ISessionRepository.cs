using MSCompanion.Data.Models;

namespace MSCompanion.Data.Interfaces;

public interface ISessionRepository
{
    Task AddAsync(UserSession session, CancellationToken ct = default);

    /// <summary>Tracked, with its <see cref="UserSession.User"/> loaded. Use for refresh and logout.</summary>
    Task<UserSession?> GetWithUserAsync(Guid sessionId, CancellationToken ct = default);

    /// <summary>
    /// True if the session exists, is not revoked or expired, and its user is still active.
    /// Called on every authenticated request.
    /// </summary>
    Task<bool> IsActiveAsync(Guid sessionId, DateTimeOffset now, CancellationToken ct = default);

    Task SaveChangesAsync(CancellationToken ct = default);
}
