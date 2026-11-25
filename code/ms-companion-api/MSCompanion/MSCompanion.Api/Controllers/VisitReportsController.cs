using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MSCompanion.Api.Dto;
using MSCompanion.Api.Extensions;
using MSCompanion.Api.Interfaces;

namespace MSCompanion.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/visit-reports")]
[Produces("application/json")]
public sealed class VisitReportsController(IVisitReportService reports) : ControllerBase
{
    [HttpGet]
    public Task<ActionResult<List<VisitReportListItemDto>>> GetAll(CancellationToken ct) =>
        Run(userId => reports.GetAllAsync(userId, ct));

    [HttpGet("{id:guid}")]
    public Task<ActionResult<VisitReportDto>> Get(Guid id, CancellationToken ct) =>
        Run(userId => reports.GetAsync(userId, id, ct));

    [HttpPost]
    public Task<ActionResult<VisitReportDto>> Create(CreateVisitReportRequest request, CancellationToken ct) =>
        Run(userId => reports.CreateAsync(userId, request, ct));

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
            _ => Problem(statusCode: 404, title: "Not found"),
        };
}
