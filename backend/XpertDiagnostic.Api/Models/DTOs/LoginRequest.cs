using System.ComponentModel.DataAnnotations;

namespace XpertDiagnostic.Api.Models.DTOs;

/// <summary>
/// Datos que envía el cliente para iniciar sesión. ASP.NET Core los valida
/// en el servidor antes de ejecutar el controlador; si no cumplen las reglas,
/// responde 400 sin llegar al servicio.
/// </summary>
/// <remarks>
/// @inv UsuarioId está entre 1 e int.MaxValue.
/// @inv Password tiene entre 1 y 72 caracteres (límite de BCrypt) y no es solo espacios.
/// @inv Rol es "M" (apartado Médico del login) o "A" (apartado Administrador). Cada apartado
///      solo acepta cuentas de su rol (P-116).
/// </remarks>
public class LoginRequest
{
    [Range(1, int.MaxValue, ErrorMessage = "El ID debe ser un número positivo.")]
    public int UsuarioId { get; set; }

    [Required(ErrorMessage = "La contraseña es obligatoria.")]
    [StringLength(72, MinimumLength = 1, ErrorMessage = "La contraseña debe tener entre 1 y 72 caracteres.")]
    public string Password { get; set; } = string.Empty;

    [Required(ErrorMessage = "Indica el apartado del inicio de sesión.")]
    [RegularExpression("^[MA]$", ErrorMessage = "El apartado debe ser M o A.")]
    public string Rol { get; set; } = string.Empty;
}
