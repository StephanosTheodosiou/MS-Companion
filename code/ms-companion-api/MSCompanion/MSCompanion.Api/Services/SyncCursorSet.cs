namespace MSCompanion.Api.Services;

public enum SyncType
{
    CheckIns,
    Medications,
    MedicationSchedules,
    MedicationIntakes,
    RelapseLogEntries,
    Appointments,
    VisitQuestions,
    SideEffects,
}

public readonly struct SyncCursorSet
{
    private const string Prefix = "v2.";
    private const string Empty = "-";
    private static readonly int Count = Enum.GetValues<SyncType>().Length;

    private readonly SyncCursor?[]? positions;

    private SyncCursorSet(SyncCursor?[] positions) => this.positions = positions;

    public SyncCursor? this[SyncType type] => positions?[(int)type];

    public static SyncCursorSet From(IReadOnlyDictionary<SyncType, SyncCursor?> cursors)
    {
        var positions = new SyncCursor?[Count];
        foreach (var (type, cursor) in cursors)
        {
            positions[(int)type] = cursor;
        }

        return new SyncCursorSet(positions);
    }

    public override string ToString()
    {
        var self = this;
        return Prefix + string.Join('.', Enum.GetValues<SyncType>().Select(t => self[t]?.ToString() ?? Empty));
    }

    public static bool TryParse(string? value, out SyncCursorSet cursors)
    {
        cursors = default;
        if (value is null)
        {
            return false;
        }

        var positions = new SyncCursor?[Count];

        if (!value.StartsWith(Prefix, StringComparison.Ordinal))
        {
            if (!SyncCursor.TryParse(value, out var checkIns))
            {
                return false;
            }

            positions[(int)SyncType.CheckIns] = checkIns;
            cursors = new SyncCursorSet(positions);
            return true;
        }

        var parts = value[Prefix.Length..].Split('.');
        if (parts.Length > Count)
        {
            return false;
        }

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

            positions[i] = cursor;
        }

        cursors = new SyncCursorSet(positions);
        return true;
    }
}
