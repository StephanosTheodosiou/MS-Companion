using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MSCompanion.Api.Dto;
using MSCompanion.Api.Extensions;
using MSCompanion.Api.Interfaces;

namespace MSCompanion.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public sealed class AuthController(IAuthService auth) : ControllerBase
{
    /// <summary>Creates an account and returns a session token.</summary>
    [HttpPost("register")]
    [ProducesResponseType<AuthResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request, CancellationToken ct)
    {
        var session = await auth.RegisterAsync(request, ct);
        if (session is null)
        {
            return Problem(
                statusCode: StatusCodes.Status409Conflict,
                title: "Email already registered",
                detail: "An account with this email already exists. Try signing in instead.");
        }

        return CreatedAtAction(nameof(Me), session);
    }

    /// <summary>Signs in with email and password and returns a session token.</summary>
    [HttpPost("login")]
    [ProducesResponseType<AuthResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request, CancellationToken ct)
    {
        var session = await auth.LoginAsync(request, ct);
        if (session is null)
        {
            return Problem(
                statusCode: StatusCodes.Status401Unauthorized,
                title: "Invalid email or password");
        }

        return Ok(session);
    }

    /// <summary>
    /// Exchanges a refresh token ("remember me" sessions only) for a new access token and refresh token.
    /// The refresh token sent here stops working: always keep the newest one.
    /// </summary>
    [HttpPost("refresh")]
    [ProducesResponseType<AuthResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthResponse>> Refresh(RefreshRequest request, CancellationToken ct)
    {
        var session = await auth.RefreshAsync(request, ct);
        if (session is null)
        {
            return Problem(
                statusCode: StatusCodes.Status401Unauthorized,
                title: "Session expired",
                detail: "The refresh token is invalid, already used, or the session has ended. Sign in again.");
        }

        return Ok(session);
    }

    /// <summary>Signs out: the current access token and its refresh token stop working immediately.</summary>
    [Authorize]
    [HttpPost("logout")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Logout(CancellationToken ct)
    {
        if (User.GetSessionId() is not { } sessionId)
        {
            return Unauthorized();
        }

        await auth.LogoutAsync(sessionId, ct);
        return NoContent();
    }

    /// <summary>Permanently deletes the account and all of its health data. Every device is signed out.</summary>
    [Authorize]
    [HttpPost("delete-account")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> DeleteAccount(DeleteAccountRequest request, CancellationToken ct)
    {
        if (User.GetUserId() is not { } userId)
        {
            return Unauthorized();
        }

        var result = await auth.DeleteAccountAsync(userId, request.Password, ct);
        return result.Error switch
        {
            null => NoContent(),
            ServiceError.IncorrectPassword => Problem(
                statusCode: StatusCodes.Status403Forbidden,
                title: "Incorrect password",
                detail: "The account was not deleted."),
            _ => Unauthorized(),
        };
    }

    /// <summary>Returns the signed-in user. Requires a Bearer token.</summary>
    [Authorize]
    [HttpGet("me")]
    [ProducesResponseType<UserDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UserDto>> Me(CancellationToken ct)
    {
        if (User.GetUserId() is not { } userId)
        {
            return Unauthorized();
        }

        var user = await auth.GetUserAsync(userId, ct);
        return user is null ? NotFound() : Ok(user);
    }
}
