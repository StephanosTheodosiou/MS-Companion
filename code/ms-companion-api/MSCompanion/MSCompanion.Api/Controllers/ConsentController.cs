using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MSCompanion.Api.Dto;
using MSCompanion.Api.Extensions;
using MSCompanion.Api.Interfaces;

namespace MSCompanion.Api.Controllers;

/// <summary>
/// Consent per data type (GDPR Art. 7). Decisions are append-only: every change adds a row,
/// so there is a full record of what the patient agreed to and when.
/// </summary>
[ApiController]
[Authorize]
[Route("api/[controller]")]
[Produces("application/json")]
public sealed class ConsentController(IConsentService consents) : ControllerBase
{
    /// <summary>The current choice for every data type (not yet decided = not granted).</summary>
    [HttpGet]
    [ProducesResponseType<IReadOnlyList<ConsentStateDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IReadOnlyList<ConsentStateDto>>> GetCurrent(CancellationToken ct)
    {
        if (User.GetUserId() is not { } userId)
        {
            return Unauthorized();
        }

        var state = await consents.GetCurrentAsync(userId, ct);
        return state is null ? PatientNotFound() : Ok(state);
    }

    /// <summary>Every decision ever made, newest first.</summary>
    [HttpGet("history")]
    [ProducesResponseType<IReadOnlyList<ConsentRecordDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IReadOnlyList<ConsentRecordDto>>> GetHistory(CancellationToken ct)
    {
        if (User.GetUserId() is not { } userId)
        {
            return Unauthorized();
        }

        var history = await consents.GetHistoryAsync(userId, ct);
        return history is null ? PatientNotFound() : Ok(history);
    }

    /// <summary>
    /// Records one or more choices (e.g. the whole onboarding consent screen). Unchanged choices are
    /// skipped. Returns the current choice for every data type.
    /// </summary>
    [HttpPost]
    [ProducesResponseType<IReadOnlyList<ConsentStateDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IReadOnlyList<ConsentStateDto>>> Record(
        RecordConsentRequest request,
        CancellationToken ct)
    {
        if (User.GetUserId() is not { } userId)
        {
            return Unauthorized();
        }

        var state = await consents.RecordAsync(userId, request, ct);
        return state is null ? PatientNotFound() : Ok(state);
    }

    private ObjectResult PatientNotFound() => Problem(
        statusCode: StatusCodes.Status404NotFound,
        title: "Patient profile not found",
        detail: "This account has no patient profile.");
}
