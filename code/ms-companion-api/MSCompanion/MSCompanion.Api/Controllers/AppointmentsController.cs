using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MSCompanion.Api.Dto;
using MSCompanion.Api.Extensions;
using MSCompanion.Api.Interfaces;
using MSCompanion.Domain.Enums;

namespace MSCompanion.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/appointments")]
[Produces("application/json")]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
public sealed class AppointmentsController(IAppointmentService appointments) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<List<AppointmentDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public Task<ActionResult<List<AppointmentDto>>> GetAll(
        [FromQuery] DateTimeOffset? from,
        [FromQuery] DateTimeOffset? to,
        [FromQuery] List<AppointmentStatus>? status,
        CancellationToken ct)
    {
        if (from is not null && to is not null && to <= from)
        {
            ModelState.AddModelError(nameof(to), "'to' must be after 'from'.");
        }

        if (Request.Query["status"].Any(v => int.TryParse(v, out _)) || status?.Any(s => !Enum.IsDefined(s)) == true)
        {
            ModelState.AddModelError(nameof(status), "Use Booked, Fulfilled, Cancelled or NoShow.");
        }

        if (!ModelState.IsValid)
        {
            return Task.FromResult<ActionResult<List<AppointmentDto>>>(ValidationProblem(ModelState));
        }

        return Run(userId => appointments.GetAllAsync(userId, from, to, status, ct));
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType<AppointmentDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public Task<ActionResult<AppointmentDto>> Get(Guid id, CancellationToken ct) =>
        Run(userId => appointments.GetAsync(userId, id, ct));

    [HttpPost]
    [ProducesResponseType<AppointmentDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public Task<ActionResult<AppointmentDto>> Create(SaveAppointmentRequest request, CancellationToken ct) =>
        Run(userId => appointments.CreateAsync(userId, request, ct));

    [HttpPut("{id:guid}")]
    [ProducesResponseType<AppointmentDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public Task<ActionResult<AppointmentDto>> Update(Guid id, SaveAppointmentRequest request, CancellationToken ct) =>
        Run(userId => appointments.UpdateAsync(userId, id, request, ct));

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        if (User.GetUserId() is not { } userId)
        {
            return Unauthorized();
        }

        var result = await appointments.DeleteAsync(userId, id, ct);
        return result.Error is { } error ? ToProblem(error) : NoContent();
    }

    private async Task<ActionResult<T>> Run<T>(Func<Guid, Task<ServiceResult<T>>> action)
    {
        if (User.GetUserId() is not { } userId)
        {
            return Unauthorized();
        }

        var result = await action(userId);
        return result.Error is { } error ? ToProblem(error) : Ok(result.Value);
    }

    private ObjectResult ToProblem(ServiceError error) =>
        error switch
        {
            ServiceError.PatientNotFound => Problem(statusCode: 404, title: "Patient profile not found"),
            ServiceError.ConsentRequired => Problem(
                statusCode: 403,
                title: "Symptom consent is required",
                detail: "Allow symptom check-ins in your consent settings first."),
            _ => Problem(statusCode: 404, title: "Not found"),
        };
}
