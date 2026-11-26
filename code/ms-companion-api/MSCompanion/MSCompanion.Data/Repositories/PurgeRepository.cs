using Microsoft.EntityFrameworkCore;
using MSCompanion.Data.Interfaces;
using MSCompanion.Data.Models;

namespace MSCompanion.Data.Repositories;

public class PurgeRepository(AppDbContext context) : IPurgeRepository
{
    public async Task<Dictionary<string, int>> PurgeDeletedBeforeAsync(DateTimeOffset cutoff, CancellationToken ct = default)
    {
        var tables = context.Model.GetEntityTypes()
            .Where(t => typeof(PatientOwnedEntity).IsAssignableFrom(t.ClrType))
            .Select(t => t.GetTableName())
            .OfType<string>()
            .Distinct()
            .ToList();

        await using var transaction = await context.Database.BeginTransactionAsync(ct);

        foreach (var table in tables)
        {
            var markSql = $$"""
                INSERT INTO sync_purge_mark (patient_id, table_name, purged_through)
                SELECT patient_id, {0}, max(server_updated_at) FROM "{{table}}"
                WHERE deleted_at < {1}
                GROUP BY patient_id
                ON CONFLICT (patient_id, table_name) DO UPDATE
                SET purged_through = GREATEST(sync_purge_mark.purged_through, EXCLUDED.purged_through)
                """;
            await context.Database.ExecuteSqlRawAsync(markSql, [table, cutoff], ct);
        }

        var deleted = new Dictionary<string, int>();
        foreach (var table in tables)
        {
            var deleteSql = $$"""DELETE FROM "{{table}}" WHERE deleted_at < {0}""";
            deleted[table] = await context.Database.ExecuteSqlRawAsync(deleteSql, [cutoff], ct);
        }

        await transaction.CommitAsync(ct);
        return deleted;
    }
}
