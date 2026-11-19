using MSCompanion.Domain.Enums;

namespace MSCompanion.Data.Models;

public class TestMetric
{
    public required string Code { get; set; }

    public TestType TestType { get; set; }

    public required string Display { get; set; }

    public required string Unit { get; set; }
}
