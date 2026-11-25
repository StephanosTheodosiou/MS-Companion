using System.Text.Json;
using System.Text.Json.Serialization;
using MSCompanion.Api.Dto;
using MSCompanion.Api.Interfaces;
using MSCompanion.Data.Interfaces;
using MSCompanion.Data.Models;

namespace MSCompanion.Api.Services;

public sealed class VisitReportService(
    IPatientRepository patients,
    IVisitReportRepository reports,
    TimeProvider clock) : IVisitReportService
{
    public const int DefaultPeriodDays = 90;

    private static readonly JsonSerializerOptions SummaryJson = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter(allowIntegerValues: false) },
    };

    public async Task<ServiceResult<VisitReportDto>> CreateAsync(
        Guid userId,
        CreateVisitReportRequest request,
        CancellationToken ct = default)
    {
        if (await patients.GetIdByUserIdAsync(userId, ct) is not { } patientId
            || await reports.GetPatientWithUserAsync(patientId, ct) is not { } patient)
        {
            return ServiceError.PatientNotFound;
        }

        var now = clock.GetUtcNow();
        now = now.AddTicks(-(now.Ticks % TimeSpan.TicksPerMicrosecond));
        var timeZone = FindTimeZone(patient.TimeZone);
        var today = LocalDate(now, timeZone);

        Appointment? upcoming;
        if (request.AppointmentId is { } appointmentId)
        {
            upcoming = await reports.GetAppointmentAsync(patientId, appointmentId, ct);
            if (upcoming is null)
            {
                return ServiceError.NotFound;
            }
        }
        else
        {
            upcoming = await reports.GetNextBookedAppointmentAsync(patientId, now, ct);
        }

        var previousBefore = upcoming is not null && upcoming.StartsAt < now ? upcoming.StartsAt : now;
        var previous = await reports.GetLastFulfilledAppointmentAsync(patientId, previousBefore, ct);

        var periodEnd = today;
        var periodStart = previous is null
            ? today.AddDays(-(DefaultPeriodDays - 1))
            : LocalDate(previous.StartsAt, timeZone);
        if (periodStart > periodEnd)
        {
            periodStart = periodEnd;
        }

        var fromUtc = StartOfDayUtc(periodStart, timeZone);
        var toUtc = StartOfDayUtc(periodEnd.AddDays(1), timeZone);

        var source = new VisitSummarySource(
            patient,
            periodStart,
            periodEnd,
            today,
            previous,
            upcoming,
            await reports.GetCheckInsAsync(patientId, periodStart, periodEnd, ct),
            await reports.GetRelapsesAsync(patientId, periodStart, periodEnd, ct),
            await reports.GetMedicationsAsync(patientId, ct),
            await reports.GetIntakesAsync(patientId, fromUtc, toUtc, ct),
            await reports.GetSideEffectsAsync(patientId, periodStart, periodEnd, ct),
            await reports.GetOpenBloodTestsAsync(patientId, ct),
            await reports.GetOpenQuestionsAsync(patientId, upcoming?.Id, ct));

        var summary = VisitSummaryBuilder.Build(source);

        var report = new VisitReport
        {
            Id = Guid.CreateVersion7(),
            PatientId = patientId,
            AppointmentId = upcoming?.Id,
            PeriodStart = periodStart,
            PeriodEnd = periodEnd,
            GeneratedAt = now,
            CreatedAt = now,
            UpdatedAt = now,
            SummaryJson = JsonSerializer.Serialize(summary, SummaryJson),
        };
        reports.Add(report);
        await reports.SaveChangesAsync(ct);

        return ToDto(report, summary);
    }

    public async Task<ServiceResult<List<VisitReportListItemDto>>> GetAllAsync(
        Guid userId,
        CancellationToken ct = default)
    {
        if (await patients.GetIdByUserIdAsync(userId, ct) is not { } patientId)
        {
            return ServiceError.PatientNotFound;
        }

        var list = await reports.GetAllAsync(patientId, ct);
        return list.Select(VisitReportListItemDto.FromEntity).ToList();
    }

    public async Task<ServiceResult<VisitReportDto>> GetAsync(
        Guid userId,
        Guid reportId,
        CancellationToken ct = default)
    {
        if (await patients.GetIdByUserIdAsync(userId, ct) is not { } patientId)
        {
            return ServiceError.PatientNotFound;
        }

        if (await reports.GetAsync(patientId, reportId, ct) is not { } report)
        {
            return ServiceError.NotFound;
        }

        var summary = JsonSerializer.Deserialize<VisitSummary>(report.SummaryJson, SummaryJson)!;
        return ToDto(report, summary);
    }

    private static VisitReportDto ToDto(VisitReport report, VisitSummary summary) => new()
    {
        Id = report.Id,
        AppointmentId = report.AppointmentId,
        PeriodStart = report.PeriodStart,
        PeriodEnd = report.PeriodEnd,
        GeneratedAt = report.GeneratedAt,
        Summary = summary,
    };

    private static TimeZoneInfo FindTimeZone(string id) =>
        TimeZoneInfo.TryFindSystemTimeZoneById(id, out var zone) ? zone : TimeZoneInfo.Utc;

    private static DateOnly LocalDate(DateTimeOffset instant, TimeZoneInfo zone) =>
        DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(instant, zone).DateTime);

    private static DateTimeOffset StartOfDayUtc(DateOnly date, TimeZoneInfo zone)
    {
        var local = date.ToDateTime(TimeOnly.MinValue);
        while (zone.IsInvalidTime(local))
        {
            local = local.AddMinutes(30);
        }

        return new DateTimeOffset(TimeZoneInfo.ConvertTimeToUtc(local, zone), TimeSpan.Zero);
    }
}
