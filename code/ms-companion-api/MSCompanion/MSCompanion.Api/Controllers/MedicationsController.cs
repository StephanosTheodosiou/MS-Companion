using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MSCompanion.Api.Dto;
using MSCompanion.Api.Extensions;
using MSCompanion.Api.Interfaces;

namespace MSCompanion.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/medications")]
[Produces("application/json")]
public sealed class MedicationsController(IMedicationService medications) : ControllerBase
{
    [HttpGet]
    public Task<ActionResult<List<MedicationDto>>> GetAll(CancellationToken ct) =>
        Run(userId => medications.GetAllAsync(userId, ct));

    [HttpGet("{id:guid}")]
    public Task<ActionResult<MedicationDto>> Get(Guid id, CancellationToken ct) =>
        Run(userId => medications.GetAsync(userId, id, ct));

    [HttpPost]
    public Task<ActionResult<MedicationDto>> Create(SaveMedicationRequest request, CancellationToken ct) =>
        Run(userId => medications.CreateAsync(userId, request, ct));

    [HttpPut("{id:guid}")]
    public Task<ActionResult<MedicationDto>> Update(Guid id, SaveMedicationRequest request, CancellationToken ct) =>
        Run(userId => medications.UpdateAsync(userId, id, request, ct));

    [HttpDelete("{id:guid}")]
    public Task<IActionResult> Delete(Guid id, CancellationToken ct) =>
        RunNoContent(userId => medications.DeleteAsync(userId, id, ct));

    [HttpPost("{id:guid}/schedules")]
    public Task<ActionResult<MedicationDto>> AddSchedule(Guid id, SaveScheduleRequest request, CancellationToken ct) =>
        Run(userId => medications.AddScheduleAsync(userId, id, request, ct));

    [HttpPut("{id:guid}/schedules/{scheduleId:guid}")]
    public Task<ActionResult<MedicationDto>> UpdateSchedule(
        Guid id,
        Guid scheduleId,
        SaveScheduleRequest request,
        CancellationToken ct) =>
        Run(userId => medications.UpdateScheduleAsync(userId, id, scheduleId, request, ct));

    [HttpDelete("{id:guid}/schedules/{scheduleId:guid}")]
    public Task<ActionResult<MedicationDto>> DeleteSchedule(Guid id, Guid scheduleId, CancellationToken ct) =>
        Run(userId => medications.DeleteScheduleAsync(userId, id, scheduleId, ct));

    [HttpPost("{id:guid}/intakes")]
    public Task<ActionResult<MedicationIntakeDto>> LogIntake(Guid id, LogIntakeRequest request, CancellationToken ct) =>
        Run(userId => medications.LogIntakeAsync(userId, id, request, ct));

    [HttpDelete("{id:guid}/intakes/{intakeId:guid}")]
    public Task<IActionResult> DeleteIntake(Guid id, Guid intakeId, CancellationToken ct) =>
        RunNoContent(userId => medications.DeleteIntakeAsync(userId, id, intakeId, ct));

    [HttpGet("intakes")]
    public Task<ActionResult<List<MedicationIntakeDto>>> GetIntakes(
        [FromQuery] DateTimeOffset from,
        [FromQuery] DateTimeOffset to,
        CancellationToken ct)
    {
        if (to <= from || to - from > TimeSpan.FromDays(366))
        {
            ModelState.AddModelError(nameof(to), "'to' must be after 'from' and at most one year later.");
            return Task.FromResult<ActionResult<List<MedicationIntakeDto>>>(ValidationProblem(ModelState));
        }

        return Run(userId => medications.GetIntakesAsync(userId, from, to, ct));
    }

    private async Task<ActionResult<T>> Run<T>(Func<Guid, Task<MedicationResult<T>>> action)
    {
        if (User.GetUserId() is not { } userId)
        {
            return Unauthorized();
        }

        var result = await action(userId);
        return result.Error is { } error ? ToProblem(error) : Ok(result.Value);
    }

    private async Task<IActionResult> RunNoContent(Func<Guid, Task<MedicationResult<bool>>> action)
    {
        if (User.GetUserId() is not { } userId)
        {
            return Unauthorized();
        }

        var result = await action(userId);
        return result.Error is { } error ? ToProblem(error) : NoContent();
    }

    private ObjectResult ToProblem(MedicationError error) =>
        error switch
        {
            MedicationError.PatientNotFound => Problem(statusCode: 404, title: "Patient profile not found"),
            MedicationError.ConsentRequired => Problem(
                statusCode: 403,
                title: "Medication consent is required",
                detail: "Allow medication data in your consent settings first."),
            MedicationError.AlreadyLogged => Problem(
                statusCode: 409,
                title: "Dose already logged",
                detail: "This reminder already has an answer."),
            _ => Problem(statusCode: 404, title: "Not found"),
        };
}
