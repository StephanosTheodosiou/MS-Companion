using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MSCompanion.Api.Dto;
using MSCompanion.Api.Extensions;
using MSCompanion.Api.Interfaces;

namespace MSCompanion.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/visit-questions")]
[Produces("application/json")]
public sealed class VisitQuestionsController(IVisitQuestionService questions) : ControllerBase
{
    [HttpGet]
    public Task<ActionResult<List<VisitQuestionDto>>> GetAll(
        [FromQuery] string? status,
        [FromQuery] Guid? appointmentId,
        CancellationToken ct)
    {
        bool? asked = status?.ToLowerInvariant() switch
        {
            null => null,
            "open" => false,
            "asked" => true,
            _ => null,
        };

        if (status is not null && asked is null)
        {
            ModelState.AddModelError(nameof(status), "Use 'open' or 'asked'.");
            return Task.FromResult<ActionResult<List<VisitQuestionDto>>>(ValidationProblem(ModelState));
        }

        return Run(userId => questions.GetAllAsync(userId, asked, appointmentId, ct));
    }

    [HttpGet("{id:guid}")]
    public Task<ActionResult<VisitQuestionDto>> Get(Guid id, CancellationToken ct) =>
        Run(userId => questions.GetAsync(userId, id, ct));

    [HttpPost]
    public Task<ActionResult<VisitQuestionDto>> Create(SaveVisitQuestionRequest request, CancellationToken ct) =>
        Run(userId => questions.CreateAsync(userId, request, ct));

    [HttpPut("{id:guid}")]
    public Task<ActionResult<VisitQuestionDto>> Update(Guid id, SaveVisitQuestionRequest request, CancellationToken ct) =>
        Run(userId => questions.UpdateAsync(userId, id, request, ct));

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        if (User.GetUserId() is not { } userId)
        {
            return Unauthorized();
        }

        var result = await questions.DeleteAsync(userId, id, ct);
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
