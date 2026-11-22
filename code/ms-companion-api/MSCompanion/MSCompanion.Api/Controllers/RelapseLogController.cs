using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MSCompanion.Api.Dto;
using MSCompanion.Api.Extensions;
using MSCompanion.Api.Interfaces;

namespace MSCompanion.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/relapse-log")]
[Produces("application/json")]
public sealed class RelapseLogController(IRelapseLogService entries) : ControllerBase
{
    [HttpGet]
    public Task<ActionResult<List<RelapseLogEntryDto>>> GetAll(CancellationToken ct) =>
        Run(userId => entries.GetAllAsync(userId, ct));

    [HttpGet("{id:guid}")]
    public Task<ActionResult<RelapseLogEntryDto>> Get(Guid id, CancellationToken ct) =>
        Run(userId => entries.GetAsync(userId, id, ct));

    [HttpPost]
    public Task<ActionResult<RelapseLogEntryDto>> Create(SaveRelapseLogEntryRequest request, CancellationToken ct) =>
        Run(userId => entries.CreateAsync(userId, request, ct));

    [HttpPut("{id:guid}")]
    public Task<ActionResult<RelapseLogEntryDto>> Update(
        Guid id,
        SaveRelapseLogEntryRequest request,
        CancellationToken ct) =>
        Run(userId => entries.UpdateAsync(userId, id, request, ct));

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        if (User.GetUserId() is not { } userId)
        {
            return Unauthorized();
        }

        var result = await entries.DeleteAsync(userId, id, ct);
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
