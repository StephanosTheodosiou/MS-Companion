using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MSCompanion.Api.Dto;
using MSCompanion.Api.Extensions;
using MSCompanion.Api.Interfaces;

namespace MSCompanion.Api.Controllers;

/// <summary>The signed-in user's health profile. Users can only ever reach their own record ("me").</summary>
[ApiController]
[Authorize]
[Route("api/[controller]")]
[Produces("application/json")]
public sealed class PatientController(IPatientService patients) : ControllerBase
{
    /// <summary>Returns the signed-in user's profile.</summary>
    [HttpGet("me")]
    [ProducesResponseType<PatientDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PatientDto>> GetMe(CancellationToken ct)
    {
        if (User.GetUserId() is not { } userId)
        {
            return Unauthorized();
        }

        var profile = await patients.GetProfileAsync(userId, ct);
        return profile is null ? PatientNotFound() : Ok(profile);
    }

    /// <summary>Replaces the signed-in user's profile. Fields left out or sent as null are cleared.</summary>
    [HttpPut("me")]
    [ProducesResponseType<PatientDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PatientDto>> UpdateMe(UpdatePatientRequest request, CancellationToken ct)
    {
        if (User.GetUserId() is not { } userId)
        {
            return Unauthorized();
        }

        var profile = await patients.UpdateProfileAsync(userId, request, ct);
        return profile is null ? PatientNotFound() : Ok(profile);
    }

    private ObjectResult PatientNotFound() => Problem(
        statusCode: StatusCodes.Status404NotFound,
        title: "Patient profile not found",
        detail: "This account has no patient profile.");
}
