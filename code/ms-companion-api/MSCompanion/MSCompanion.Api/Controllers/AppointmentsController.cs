using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MSCompanion.Api.Dto;
using MSCompanion.Api.Extensions;
using MSCompanion.Api.Interfaces;

namespace MSCompanion.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/appointments")]
[Produces("application/json")]
public sealed class AppointmentsController(IAppointmentService appointments) : ControllerBase
{
    [HttpGet]
    public Task<ActionResult<List<AppointmentDto>>> GetAll(
        [FromQuery] DateTimeOffset? from,
        [FromQuery] DateTimeOffset? to,
        CancellationToken ct)
    {
        if (from is not null && to is not null && to <= from)
        {
            ModelState.AddModelError(nameof(to), "'to' must be after 'from'.");
            return Task.FromResult<ActionResult<List<AppointmentDto>>>(ValidationProblem(ModelState));
        }

        return Run(userId => appointments.GetAllAsync(userId, from, to, ct));
    }

    [HttpGet("{id:guid}")]
    public Task<ActionResult<AppointmentDto>> Get(Guid id, CancellationToken ct) =>
        Run(userId => appointments.GetAsync(userId, id, ct));

    [HttpPost]
    public Task<ActionResult<AppointmentDto>> Create(SaveAppointmentRequest request, CancellationToken ct) =>
        Run(userId => appointments.CreateAsync(userId, request, ct));

    [HttpPut("{id:guid}")]
    public Task<ActionResult<AppointmentDto>> Update(Guid id, SaveAppointmentRequest request, CancellationToken ct) =>
        Run(userId => appointments.UpdateAsync(userId, id, request, ct));

    [HttpDelete("{id:guid}")]
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
