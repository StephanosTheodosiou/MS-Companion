using Microsoft.EntityFrameworkCore;
using MSCompanion.Data.Interfaces;
using MSCompanion.Data.Models;

namespace MSCompanion.Data.Repositories;

public class SessionRepository(AppDbContext context) : ISessionRepository
{
    public async Task AddAsync(UserSession session, CancellationToken ct = default)
    {
        context.UserSessions.Add(session);
        await context.SaveChangesAsync(ct);
    }

    public Task<UserSession?> GetWithUserAsync(Guid sessionId, CancellationToken ct = default) =>
        context.UserSessions.Include(s => s.User).FirstOrDefaultAsync(s => s.Id == sessionId, ct);

    public Task<bool> IsActiveAsync(Guid sessionId, DateTimeOffset now, CancellationToken ct = default) =>
        context.UserSessions.AnyAsync(
            s => s.Id == sessionId && s.RevokedAt == null && s.ExpiresAt > now && s.User.IsActive,
            ct);

    public Task SaveChangesAsync(CancellationToken ct = default) => context.SaveChangesAsync(ct);
}
