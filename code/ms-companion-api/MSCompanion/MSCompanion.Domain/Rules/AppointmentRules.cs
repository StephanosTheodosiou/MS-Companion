using MSCompanion.Domain.Enums;

namespace MSCompanion.Domain.Rules;

public static class AppointmentRules
{
    public const int ClinicianNameMaxLength = 150;
    public const int LocationMaxLength = 200;
    public const int NoteMaxLength = 1000;

    private static readonly TimeSpan ClockTolerance = TimeSpan.FromMinutes(5);

    public static bool EndsAfterStart(DateTimeOffset startsAt, DateTimeOffset? endsAt) =>
        endsAt is null || endsAt > startsAt;

    public static bool StatusFitsTime(AppointmentStatus status, DateTimeOffset startsAt, DateTimeOffset now) =>
        status is not (AppointmentStatus.Fulfilled or AppointmentStatus.NoShow) || startsAt <= now + ClockTolerance;
}
