using MSCompanion.Data.Models;

namespace MSCompanion.Data.Interfaces;

public interface IUserRepository
{
    Task<User?> GetByIdAsync(Guid id, CancellationToken ct = default);

    /// <param name="normalizedEmail">Trimmed, lower-case email.</param>
    Task<User?> GetByEmailAsync(string normalizedEmail, CancellationToken ct = default);

    /// <summary>Inserts the user. Returns false if the email is already registered.</summary>
    Task<bool> TryAddAsync(User user, CancellationToken ct = default);
}
