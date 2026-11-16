using Microsoft.EntityFrameworkCore;
using MSCompanion.Data.Interfaces;
using MSCompanion.Data.Models;
using Npgsql;

namespace MSCompanion.Data.Repositories;

public class UserRepository(AppDbContext context) : IUserRepository
{
    public Task<User?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == id, ct);

    public Task<User?> GetByEmailAsync(string normalizedEmail, CancellationToken ct = default) =>
        context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Email == normalizedEmail, ct);

    /// <summary>
    /// Inserts the user together with anything attached to it (e.g. its <see cref="Patient"/>)
    /// in a single SaveChanges, so either all rows are written or none are.
    /// </summary>
    public async Task<bool> TryAddAsync(User user, CancellationToken ct = default)
    {
        context.Users.Add(user);
        try
        {
            await context.SaveChangesAsync(ct);
            return true;
        }
        catch (DbUpdateException ex) when (
            ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            // Relying on the unique index (instead of "check, then insert") is race-safe.
            // Clear() also detaches the attached Patient, not only the user.
            context.ChangeTracker.Clear();
            return false;
        }
    }
}
