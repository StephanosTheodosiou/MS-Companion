using System.Text;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;
using MSCompanion.Api.Extensions;
using MSCompanion.Api.Interfaces;
using MSCompanion.Api.Options;
using MSCompanion.Api.Services;
using MSCompanion.Data.Interfaces;
using MSCompanion.Data.Models;
using MSCompanion.Data.Repositories;

var builder = WebApplication.CreateBuilder(args);

// 1. Database — PostgreSQL with snake_case table/column names
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<AppDbContext>(options => options
    .UseNpgsql(connectionString)
    .UseSnakeCaseNamingConvention());

// 2. Options — validated at startup so a missing secret fails fast with a clear message
builder.Services.AddOptions<JwtOptions>()
    .Bind(builder.Configuration.GetSection(JwtOptions.SectionName))
    .ValidateDataAnnotations()
    .ValidateOnStart();

// 3. Dependency injection — register repositories and services here
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<ISessionRepository, SessionRepository>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IPatientRepository, PatientRepository>();
builder.Services.AddScoped<IPatientService, PatientService>();
builder.Services.AddScoped<IConsentRepository, ConsentRepository>();
builder.Services.AddScoped<IConsentService, ConsentService>();
builder.Services.AddScoped<ISyncRepository, SyncRepository>();
builder.Services.AddScoped<MedicationRelapseSync>();
builder.Services.AddScoped<ISyncService, SyncService>();
builder.Services.AddScoped<IMedicationRepository, MedicationRepository>();
builder.Services.AddScoped<IMedicationService, MedicationService>();
builder.Services.AddScoped<IRelapseLogRepository, RelapseLogRepository>();
builder.Services.AddScoped<IRelapseLogService, RelapseLogService>();

// 4. Authentication (JWT bearer) and authorization
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer();
builder.Services.AddOptions<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme)
    .Configure<IOptions<JwtOptions>>((bearer, jwtOptions) =>
    {
        var jwt = jwtOptions.Value;
        bearer.MapInboundClaims = false; // keep claim names exactly as issued: "sub", "email", "role"
        bearer.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwt.Issuer,
            ValidAudience = jwt.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Key)),
            NameClaimType = JwtRegisteredClaimNames.Sub,
            RoleClaimType = "role",
            ClockSkew = TimeSpan.FromSeconds(30),
        };

        // A valid signature is not enough: the token's session must still be active, so logout
        // (and deactivating an account) takes effect immediately instead of when the token expires.
        bearer.Events = new JwtBearerEvents
        {
            OnTokenValidated = async context =>
            {
                var sessions = context.HttpContext.RequestServices.GetRequiredService<ISessionRepository>();
                var clock = context.HttpContext.RequestServices.GetRequiredService<TimeProvider>();

                if (context.Principal?.GetSessionId() is not { } sessionId
                    || !await sessions.IsActiveAsync(sessionId, clock.GetUtcNow(), context.HttpContext.RequestAborted))
                {
                    context.Fail("The session has ended. Sign in again.");
                }
            },
        };
    });
builder.Services.AddAuthorization();

// 5. CORS — only the Expo *web* build needs this; native iOS/Android apps don't use CORS
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(options => options.AddDefaultPolicy(policy => policy
    .WithOrigins(allowedOrigins)
    .AllowAnyHeader()
    .AllowAnyMethod()));

// 6. Controllers, error responses, OpenAPI and health checks
builder.Services.AddControllers()
    // Enums travel as readable strings ("RelapsingRemitting"), matching how they are stored in the database.
    .AddJsonOptions(options => options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter(allowIntegerValues: false)));
builder.Services.AddRouting(options => options.LowercaseUrls = true);
builder.Services.AddProblemDetails(); // RFC 7807 error bodies: { type, title, status, detail }
builder.Services.AddOpenApi(options => options.AddBearerSecurityScheme());
builder.Services.AddHealthChecks().AddDbContextCheck<AppDbContext>("database");

var app = builder.Build();

if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException(
        "ConnectionStrings:DefaultConnection is not set. Set it with `dotnet user-secrets` (see README.md).");
}

// 7. HTTP pipeline
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi(); // /openapi/v1.json
    app.UseSwaggerUI(options => options.SwaggerEndpoint("/openapi/v1.json", "MS Companion API v1")); // /swagger
}
else
{
    app.UseExceptionHandler(); // unhandled exceptions → ProblemDetails, no stack traces leaked to clients
    app.UseHsts();
    app.UseHttpsRedirection();
}

app.UseStatusCodePages();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHealthChecks("/health");

app.Run();
