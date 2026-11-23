namespace MSCompanion.Api.Services;

public readonly record struct SyncCursorSet(
    SyncCursor? CheckIns,
    SyncCursor? Medications,
    SyncCursor? MedicationSchedules,
    SyncCursor? MedicationIntakes,
    SyncCursor? RelapseLogEntries)
{
    private const string Prefix = "v2.";
    private const string Empty = "-";

    public override string ToString() =>
        Prefix + string.Join('.', new[] { CheckIns, Medications, MedicationSchedules, MedicationIntakes, RelapseLogEntries }
            .Select(c => c?.ToString() ?? Empty));

    public static bool TryParse(string? value, out SyncCursorSet cursors)
    {
        cursors = default;
        if (value is null)
        {
            return false;
        }

        // Cursors issued before medication and relapse sync only cover check-ins.
        if (!value.StartsWith(Prefix, StringComparison.Ordinal))
        {
            if (!SyncCursor.TryParse(value, out var checkIns))
            {
                return false;
            }

            cursors = new SyncCursorSet(checkIns, null, null, null, null);
            return true;
        }

        var parts = value[Prefix.Length..].Split('.');
        if (parts.Length != 5)
        {
            return false;
        }

        var parsed = new SyncCursor?[parts.Length];
        for (var i = 0; i < parts.Length; i++)
        {
            if (parts[i] == Empty)
            {
                continue;
            }

            if (!SyncCursor.TryParse(parts[i], out var cursor))
            {
                return false;
            }

            parsed[i] = cursor;
        }

        cursors = new SyncCursorSet(parsed[0], parsed[1], parsed[2], parsed[3], parsed[4]);
        return true;
    }
}
