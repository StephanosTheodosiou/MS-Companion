using MSCompanion.Domain.Enums;

namespace MSCompanion.Data.Models;

public class TestSession : PatientOwnedEntity
{
    public TestType TestType { get; set; }

    public TestSessionStatus Status { get; set; }

    public bool IsPractice { get; set; }

    public DateTimeOffset StartedAt { get; set; }

    public DateTimeOffset EndedAt { get; set; }

    public required string TimeZone { get; set; }

    public required string AppVersion { get; set; }

    public string? DeviceModel { get; set; }

    public ICollection<TestResult> Results { get; set; } = [];

    public TestRawData? RawData { get; set; }
}
