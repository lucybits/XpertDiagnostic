using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using XpertDiagnostic.Api.Configuration;
using XpertDiagnostic.Api.Data;
using XpertDiagnostic.Api.Middleware;
using XpertDiagnostic.Api.Models.DTOs;
using XpertDiagnostic.Api.Repositories;
using XpertDiagnostic.Api.Services;
using XpertDiagnostic.Api.Services.Interfaces;

var builder = WebApplication.CreateBuilder(args);

// ── Configuración segura ────────────────────────────────────────────────
// Los secretos (cadena de conexión y Jwt:Key) no están en el código ni en appsettings.json.
// En desarrollo se leen de dotnet user-secrets; en otros entornos, de variables de entorno
// (ConnectionStrings__DefaultConnection y Jwt__Key). Ver specs/guias/guia-instalacion.md.
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException(
        "Falta ConnectionStrings:DefaultConnection. Configúrala con dotnet user-secrets " +
        "o con la variable de entorno ConnectionStrings__DefaultConnection.");
}

builder.Services
    .AddOptions<JwtOptions>()
    .Bind(builder.Configuration.GetSection(JwtOptions.Seccion))
    .ValidateDataAnnotations()
    .ValidateOnStart();

// ── Capa de presentación (controladores) ────────────────────────────────
builder.Services
    .AddControllers()
    .ConfigureApiBehaviorOptions(options =>
        options.InvalidModelStateResponseFactory = _ =>
            new BadRequestObjectResult(new ErrorResponse("Datos inválidos")));

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();

// ── Capa de datos ───────────────────────────────────────────────────────
builder.Services.AddDbContext<AppDbContext>(options => options.UseSqlServer(connectionString));
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IDoctorRepository, DoctorRepository>();
builder.Services.AddScoped<IPatientRepository, PatientRepository>();
builder.Services.AddScoped<ICatalogRepository, CatalogRepository>();
builder.Services.AddScoped<IPatientRecordRepository, PatientRecordRepository>();
builder.Services.AddScoped<IPatientResultRepository, PatientResultRepository>();
builder.Services.AddScoped<IDiagnosisValidationRepository, DiagnosisValidationRepository>();
builder.Services.AddScoped<IPatientHistoryRepository, PatientHistoryRepository>();

// ── Capa de servicios ───────────────────────────────────────────────────
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddSingleton<IPasswordCredentialVerifier, PasswordCredentialVerifier>();
builder.Services.AddSingleton<ITokenService, JwtTokenService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddSingleton<IPasswordHasher, BCryptPasswordHasher>();
builder.Services.AddScoped<IDoctorService, DoctorService>();
builder.Services.AddScoped<IDoctorAdministrationService, DoctorAdministrationService>();
builder.Services.AddScoped<ISessionValidator, SessionValidator>();
builder.Services.AddScoped<IPatientService, PatientService>();
builder.Services.AddScoped<ICatalogService, CatalogService>();
builder.Services.AddScoped<IPatientRecordService, PatientRecordService>();
builder.Services.AddScoped<IDiagnosisService, DiagnosisService>();
builder.Services.AddScoped<IPatientResultService, PatientResultService>();
builder.Services.AddScoped<IDiagnosisValidationService, DiagnosisValidationService>();
builder.Services.AddScoped<IPatientHistoryService, PatientHistoryService>();
// Máquina de inferencia del equipo (P-160): conversión de inference_engine.prg. Reemplaza al motor
// provisional y al ai-service. Los servicios dependen de IInferenceEngine, no de esta clase.
builder.Services.AddScoped<ITreatmentRepository, TreatmentRepository>();
builder.Services.AddScoped<IInferenceEngine, InferenceEngine>();
builder.Services.AddScoped<IDatabaseHealthService, DatabaseHealthService>();

// ── Autenticación JWT (valida los tokens que emite JwtTokenService) ─────
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer();

builder.Services
    .AddOptions<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme)
    .Configure<IOptions<JwtOptions>>((bearer, jwt) =>
    {
        var opciones = jwt.Value;
        bearer.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = opciones.Issuer,
            ValidateAudience = true,
            ValidAudience = opciones.Audience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(opciones.Key)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(1)
        };

        // Un token bien firmado no basta: la cuenta debe seguir existiendo, activa y con el mismo rol.
        // Así, desactivar a un médico cierra sus sesiones abiertas de inmediato (P-116).
        bearer.Events = new JwtBearerEvents
        {
            OnTokenValidated = async context =>
            {
                var principal = context.Principal;
                var vigente = int.TryParse(principal?.FindFirstValue(ClaimTypes.NameIdentifier), out var usuarioId)
                    && await context.HttpContext.RequestServices
                        .GetRequiredService<ISessionValidator>()
                        .EsVigenteAsync(usuarioId, principal?.FindFirstValue(ClaimTypes.Role), context.HttpContext.RequestAborted);

                if (!vigente)
                    context.Fail("La cuenta del token no existe, está desactivada o cambió de rol.");
            }
        };
    });

builder.Services.AddAuthorization();

// ── CORS: orígenes permitidos definidos en configuración ────────────────
var origenesPermitidos = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>() ?? [];

builder.Services.AddCors(options =>
    options.AddPolicy("Frontend", policy =>
        policy.WithOrigins(origenesPermitidos)
              .AllowAnyHeader()
              .AllowAnyMethod()));

var app = builder.Build();

app.UseExceptionHandler();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("Frontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
