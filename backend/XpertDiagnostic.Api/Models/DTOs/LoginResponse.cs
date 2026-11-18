namespace XpertDiagnostic.Api.Models.DTOs;

/// <summary>
/// Respuesta de un inicio de sesión correcto.
/// </summary>
/// <remarks>
/// @inv Token no está vacío y ExpiraEn es una fecha UTC futura al momento de emitirse.
/// </remarks>
public class LoginResponse
{
    public int UsuarioId { get; set; }
    public string Rol { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiraEn { get; set; }
}
