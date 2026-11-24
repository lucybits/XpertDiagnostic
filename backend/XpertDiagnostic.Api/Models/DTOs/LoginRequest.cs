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
/// @inv Rol es "T" (apartado Médico) o "A" (apartado Administrador). El apartado Médico
///      acepta cuentas "T" e "I" (P-116).
/// </remarks>
public class LoginRequest
{
    [Range(1, int.MaxValue, ErrorMessage = "El ID debe ser un número positivo.")]
    public int UsuarioId { get; set; }

    [Required(ErrorMessage = "La contraseña es obligatoria.")]
    [StringLength(72, MinimumLength = 1, ErrorMessage = "La contraseña debe tener entre 1 y 72 caracteres.")]
    public string Password { get; set; } = string.Empty;

    [Required(ErrorMessage = "Indica el apartado del inicio de sesión.")]
    [RegularExpression("^[TA]$", ErrorMessage = "El apartado debe ser T o A.")]
    public string Rol { get; set; } = string.Empty;
}
