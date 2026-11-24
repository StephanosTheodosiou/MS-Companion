using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MSCompanion.Api.Dto;
using MSCompanion.Api.Extensions;
using MSCompanion.Api.Interfaces;

namespace MSCompanion.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/blood-tests")]
[Produces("application/json")]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
public sealed class BloodTestsController(IBloodTestService bloodTests) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<List<BloodTestDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public Task<ActionResult<List<BloodTestDto>>> GetAll(
        [FromQuery] BloodTestStatus? status,
        [FromQuery] Guid? medicationId,
        CancellationToken ct)
    {
        if (int.TryParse(Request.Query["status"], out _) || status is { } s && !Enum.IsDefined(s))
        {
            ModelState.AddModelError(nameof(status), "Use Upcoming, Overdue or Completed.");
            return Task.FromResult<ActionResult<List<BloodTestDto>>>(ValidationProblem(ModelState));
        }

        return Run(userId => bloodTests.GetAllAsync(userId, status, medicationId, ct));
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType<BloodTestDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public Task<ActionResult<BloodTestDto>> Get(Guid id, CancellationToken ct) =>
        Run(userId => bloodTests.GetAsync(userId, id, ct));

    [HttpPost]
    [ProducesResponseType<BloodTestDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public Task<ActionResult<BloodTestDto>> Create(SaveBloodTestRequest request, CancellationToken ct) =>
        Run(userId => bloodTests.CreateAsync(userId, request, ct));

    [HttpPut("{id:guid}")]
    [ProducesResponseType<BloodTestDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public Task<ActionResult<BloodTestDto>> Update(Guid id, SaveBloodTestRequest request, CancellationToken ct) =>
        Run(userId => bloodTests.UpdateAsync(userId, id, request, ct));

    [HttpPost("{id:guid}/complete")]
    [ProducesResponseType<CompleteBloodTestResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public Task<ActionResult<CompleteBloodTestResponse>> Complete(
        Guid id,
        CompleteBloodTestRequest request,
        CancellationToken ct) =>
        Run(userId => bloodTests.CompleteAsync(userId, id, request, ct));

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        if (User.GetUserId() is not { } userId)
        {
            return Unauthorized();
        }

        var result = await bloodTests.DeleteAsync(userId, id, ct);
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
                title: "Medication consent is required",
                detail: "Allow medication data in your consent settings first."),
            ServiceError.AlreadyCompleted => Problem(
                statusCode: 409,
                title: "Blood test already completed",
                detail: "This reminder is already marked as done."),
            ServiceError.DateInFuture => Problem(
                statusCode: 400,
                title: "Completion date is in the future",
                detail: "Use today or an earlier date."),
            _ => Problem(statusCode: 404, title: "Not found"),
        };
}
