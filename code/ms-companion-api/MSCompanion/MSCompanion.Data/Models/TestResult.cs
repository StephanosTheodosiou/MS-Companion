using MSCompanion.Domain.Enums;

namespace MSCompanion.Data.Models;

public class TestResult
{
    public Guid Id { get; set; }

    public Guid SessionId { get; set; }

    public TestSession Session { get; set; } = null!;

    public TestType TestType { get; set; }

    public required string MetricCode { get; set; }

    public TestMetric Metric { get; set; } = null!;

    public Laterality? Laterality { get; set; }

    public decimal Value { get; set; }
}
