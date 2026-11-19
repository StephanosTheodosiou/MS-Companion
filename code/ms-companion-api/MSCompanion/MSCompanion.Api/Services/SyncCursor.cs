using System.Globalization;

namespace MSCompanion.Api.Services;

public readonly record struct SyncCursor(DateTimeOffset ServerUpdatedAt, Guid Id)
{
    public override string ToString() =>
        $"{ServerUpdatedAt.UtcTicks.ToString(CultureInfo.InvariantCulture)}_{Id:N}";

    public static bool TryParse(string? value, out SyncCursor cursor)
    {
        cursor = default;
        var parts = value?.Split('_');
        if (parts is not [var ticksText, var idText]
            || !long.TryParse(ticksText, NumberStyles.None, CultureInfo.InvariantCulture, out var ticks)
            || ticks < DateTimeOffset.MinValue.UtcTicks
            || ticks > DateTimeOffset.MaxValue.UtcTicks
            || !Guid.TryParseExact(idText, "N", out var id))
        {
            return false;
        }

        cursor = new SyncCursor(new DateTimeOffset(ticks, TimeSpan.Zero), id);
        return true;
    }
}
