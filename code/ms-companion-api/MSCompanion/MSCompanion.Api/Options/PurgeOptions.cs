using System.ComponentModel.DataAnnotations;

namespace MSCompanion.Api.Options;

public sealed class PurgeOptions
{
    public const string SectionName = "Purge";

    [Range(7, 3650)]
    public int RetentionDays { get; init; } = 30;

    [Range(1, 168)]
    public int IntervalHours { get; init; } = 24;
}
