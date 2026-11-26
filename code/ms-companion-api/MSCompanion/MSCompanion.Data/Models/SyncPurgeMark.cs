namespace MSCompanion.Data.Models;

public class SyncPurgeMark
{
    public Guid PatientId { get; set; }

    public Patient Patient { get; set; } = null!;

    public required string TableName { get; set; }

    public DateTimeOffset PurgedThrough { get; set; }
}
