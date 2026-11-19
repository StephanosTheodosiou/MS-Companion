namespace MSCompanion.Data.Models;

public class TestRawData
{
    public Guid SessionId { get; set; }

    public TestSession Session { get; set; } = null!;

    public short FormatVersion { get; set; }

    public required string Payload { get; set; }
}
