using MSCompanion.Domain.Enums;

namespace MSCompanion.Data.Models;

public class CheckInAnswer
{
    public Guid CheckInId { get; set; }

    public CheckIn CheckIn { get; set; } = null!;

    public CheckInItem Item { get; set; }

    public short Score { get; set; }
}
