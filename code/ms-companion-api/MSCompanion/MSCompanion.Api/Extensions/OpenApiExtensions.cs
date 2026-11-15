using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi;

namespace MSCompanion.Api.Extensions;

public static class OpenApiExtensions
{
    private const string SchemeName = "Bearer";

    /// <summary>Adds a JWT "Bearer" scheme so Swagger UI shows an "Authorize" button.</summary>
    public static OpenApiOptions AddBearerSecurityScheme(this OpenApiOptions options) =>
        options.AddDocumentTransformer((document, _, _) =>
        {
            document.Components ??= new OpenApiComponents();
            document.Components.SecuritySchemes ??= new Dictionary<string, IOpenApiSecurityScheme>();
            document.Components.SecuritySchemes[SchemeName] = new OpenApiSecurityScheme
            {
                Type = SecuritySchemeType.Http,
                Scheme = "bearer",
                BearerFormat = "JWT",
                Description = "Paste the token returned by POST /api/auth/login.",
            };
            document.Security =
            [
                new OpenApiSecurityRequirement { [new OpenApiSecuritySchemeReference(SchemeName, document)] = [] },
            ];
            return Task.CompletedTask;
        });
}
