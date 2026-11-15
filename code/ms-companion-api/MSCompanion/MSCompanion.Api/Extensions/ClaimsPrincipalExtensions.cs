using System.Security.Claims;
using Microsoft.IdentityModel.JsonWebTokens;

namespace MSCompanion.Api.Extensions;

public static class ClaimsPrincipalExtensions
{
    /// <summary>
    /// The signed-in user's id, read from the JWT "sub" claim. Use inside [Authorize] controllers:
    /// <c>if (User.GetUserId() is not { } userId) return Unauthorized();</c>
    /// </summary>
    public static Guid? GetUserId(this ClaimsPrincipal principal) =>
        Guid.TryParse(principal.FindFirst(JwtRegisteredClaimNames.Sub)?.Value, out var id) ? id : null;

    /// <summary>The login session this token belongs to, read from the JWT "sid" claim.</summary>
    public static Guid? GetSessionId(this ClaimsPrincipal principal) =>
        Guid.TryParse(principal.FindFirst(JwtRegisteredClaimNames.Sid)?.Value, out var id) ? id : null;
}
