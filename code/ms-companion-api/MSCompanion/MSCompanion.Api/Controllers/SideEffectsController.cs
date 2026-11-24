using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MSCompanion.Api.Dto;
using MSCompanion.Api.Extensions;
using MSCompanion.Api.Interfaces;

namespace MSCompanion.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/side-effects")]
[Produces("application/json")]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
public sealed class SideEffectsController(ISideEffectService sideEffects) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<List<SideEffectDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public Task<ActionResult<List<SideEffectDto>>> GetAll(
        [FromQuery] Guid? medicationId,
        [FromQuery] bool? ongoing,
        CancellationToken ct) =>
        Run(userId => sideEffects.GetAllAsync(userId, medicationId, ongoing, ct));

    [HttpGet("{id:guid}")]
    [ProducesResponseType<SideEffectDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public Task<ActionResult<SideEffectDto>> Get(Guid id, CancellationToken ct) =>
        Run(userId => sideEffects.GetAsync(userId, id, ct));

    [HttpPost]
    [ProducesResponseType<SideEffectDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public Task<ActionResult<SideEffectDto>> Create(SaveSideEffectRequest request, CancellationToken ct) =>
        Run(userId => sideEffects.CreateAsync(userId, request, ct));

    [HttpPut("{id:guid}")]
    [ProducesResponseType<SideEffectDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public Task<ActionResult<SideEffectDto>> Update(Guid id, SaveSideEffectRequest request, CancellationToken ct) =>
        Run(userId => sideEffects.UpdateAsync(userId, id, request, ct));

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        if (User.GetUserId() is not { } userId)
        {
            return Unauthorized();
        }

        var result = await sideEffects.DeleteAsync(userId, id, ct);
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
            _ => Problem(statusCode: 404, title: "Not found"),
        };
}
