using Microsoft.Extensions.Options;
using MSCompanion.Api.Options;
using MSCompanion.Data.Interfaces;

namespace MSCompanion.Api.Services;

public sealed class PurgeDeletedDataService(
    IServiceScopeFactory scopes,
    IOptions<PurgeOptions> options,
    TimeProvider clock,
    ILogger<PurgeDeletedDataService> logger) : BackgroundService
{
    private readonly PurgeOptions _options = options.Value;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromHours(_options.IntervalHours), clock);
        do
        {
            await PurgeOnceAsync(stoppingToken);
        }
        while (await timer.WaitForNextTickAsync(stoppingToken));
    }

    private async Task PurgeOnceAsync(CancellationToken ct)
    {
        try
        {
            using var scope = scopes.CreateScope();
            var purge = scope.ServiceProvider.GetRequiredService<IPurgeRepository>();
            var cutoff = clock.GetUtcNow().AddDays(-_options.RetentionDays);
            var deleted = await purge.PurgeDeletedBeforeAsync(cutoff, ct);

            var total = deleted.Values.Sum();
            if (total > 0)
            {
                logger.LogInformation(
                    "Purged {Total} rows deleted before {Cutoff:u}: {Tables}",
                    total,
                    cutoff,
                    string.Join(", ", deleted.Where(d => d.Value > 0).Select(d => $"{d.Key}={d.Value}")));
            }
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Purging deleted data failed; it will be retried on the next run");
        }
    }
}
