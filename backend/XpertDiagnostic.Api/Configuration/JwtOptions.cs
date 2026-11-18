using System.ComponentModel.DataAnnotations;

namespace XpertDiagnostic.Api.Configuration;

/// <summary>
/// Configuración de los tokens JWT, leída de la sección <c>Jwt</c>.
/// <c>Issuer</c>, <c>Audience</c> y <c>ExpirationMinutes</c> no son secretos y viven en appsettings.json.
/// <c>Key</c> es secreta: se define con <c>dotnet user-secrets</c> en desarrollo o con la
/// variable de entorno <c>Jwt__Key</c> en otros entornos, nunca en el código ni en el repositorio.
/// </summary>
/// <remarks>
/// @inv Key tiene al menos 32 caracteres (256 bits, mínimo para HMAC-SHA256).
/// @inv Issuer y Audience no están vacíos.
/// @inv ExpirationMinutes está entre 1 y 1440.
/// La aplicación valida estas invariantes al arrancar (ValidateOnStart) y se detiene si no se cumplen.
/// </remarks>
public sealed class JwtOptions
{
    public const string Seccion = "Jwt";

    [Required(ErrorMessage = "Falta configurar Jwt:Key (usa dotnet user-secrets o la variable Jwt__Key).")]
    [MinLength(32, ErrorMessage = "Jwt:Key debe tener al menos 32 caracteres.")]
    public string Key { get; init; } = string.Empty;

    [Required]
    public string Issuer { get; init; } = string.Empty;

    [Required]
    public string Audience { get; init; } = string.Empty;

    [Range(1, 1440)]
    public int ExpirationMinutes { get; init; } = 120;
}
