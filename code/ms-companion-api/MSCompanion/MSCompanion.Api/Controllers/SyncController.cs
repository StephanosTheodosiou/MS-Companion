using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MSCompanion.Api.Dto;
using MSCompanion.Api.Extensions;
using MSCompanion.Api.Interfaces;
using MSCompanion.Api.Services;

namespace MSCompanion.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
[Produces("application/json")]
public sealed class SyncController(ISyncService sync) : ControllerBase
{
    [HttpPost("push")]
    [ProducesResponseType<SyncPushResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SyncPushResponse>> Push(SyncPushRequest request, CancellationToken ct)
    {
        if (User.GetUserId() is not { } userId)
        {
            return Unauthorized();
        }

        var response = await sync.PushAsync(userId, request, ct);
        return response is null ? PatientNotFound() : Ok(response);
    }

    [HttpGet("pull")]
    [ProducesResponseType<SyncPullResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SyncPullResponse>> Pull(
        [FromQuery] string? cursor,
        [FromQuery, Range(1, 500)] int limit = 200,
        CancellationToken ct = default)
    {
        if (User.GetUserId() is not { } userId)
        {
            return Unauthorized();
        }

        SyncCursor? after = null;
        if (cursor is not null)
        {
            if (!SyncCursor.TryParse(cursor, out var parsed))
            {
                ModelState.AddModelError(nameof(cursor), "The cursor is not valid. Send the cursor from the last pull, or none.");
                return ValidationProblem(ModelState);
            }

            after = parsed;
        }

        var response = await sync.PullAsync(userId, after, limit, ct);
        return response is null ? PatientNotFound() : Ok(response);
    }

    private ObjectResult PatientNotFound() => Problem(
        statusCode: StatusCodes.Status404NotFound,
        title: "Patient profile not found",
        detail: "This account has no patient profile.");
}
