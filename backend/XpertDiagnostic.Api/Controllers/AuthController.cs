using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using XpertDiagnostic.Api.Configuration;
using XpertDiagnostic.Api.Models.DTOs;
using XpertDiagnostic.Api.Models.Results;
using XpertDiagnostic.Api.Services.Interfaces;

namespace XpertDiagnostic.Api.Controllers;

/// <summary>
/// Controlador de autenticación. Solo traduce HTTP ↔ servicio: los datos llegan ya validados
/// por los DTO ([ApiController] responde 400 si no lo están), la lógica vive en la fachada
/// <see cref="IAuthService"/> y las excepciones las maneja GlobalExceptionHandler.
/// </summary>
[ApiController]
[Route("api/auth")]
[Produces("application/json")]
public class AuthController(IAuthService auth) : ControllerBase
{
    private const string MensajeCredencialesIncorrectas = "ID o contraseña incorrectos. Vuelve a intentarlo.";
    private const string MensajeEsCuentaDeMedico = "Esta cuenta es de médico. Inicia sesión desde el apartado Médico.";
    private const string MensajeEsCuentaDeAdministrador = "Esta cuenta es de administrador. Inicia sesión desde el apartado Administrador.";
    private const string MensajeCuentaInactiva = "Tu cuenta está desactivada. Comunícate con el administrador del sistema.";

    /// <summary>Inicia sesión con ID de usuario y contraseña desde un apartado (Médico o Administrador).</summary>
    /// <remarks>
    /// @pre request cumple las reglas de <see cref="LoginRequest"/> (lo garantiza la validación del modelo).
    /// @post 200 con <see cref="LoginResponse"/> si las credenciales son correctas, el rol coincide con el
    ///       apartado y la cuenta está activa.
    /// @post 401 con <see cref="ErrorResponse"/> si el ID no existe o la contraseña no coincide
    ///       (mismo mensaje en ambos casos para no revelar qué IDs existen).
    /// @post 403 con <see cref="ErrorResponse"/> si la contraseña es correcta pero la cuenta es de otro
    ///       apartado o está desactivada.
    /// </remarks>
    [HttpPost("login")]
    [ProducesResponseType<LoginResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status503ServiceUnavailable)]
    public async Task<ActionResult<LoginResponse>> Login(
        [FromBody] LoginRequest request,
        CancellationToken cancellationToken)
    {
        var resultado = await auth.LoginAsync(request.UsuarioId, request.Password, request.Rol, cancellationToken);

        return resultado.Estado switch
        {
            LoginStatus.Exitoso => Ok(resultado.Respuesta),
            LoginStatus.ApartadoIncorrecto => Prohibido(UserRoles.EsMedico(resultado.RolDeLaCuenta)
                ? MensajeEsCuentaDeMedico
                : MensajeEsCuentaDeAdministrador),
            LoginStatus.CuentaInactiva => Prohibido(MensajeCuentaInactiva),
            _ => Unauthorized(new ErrorResponse(MensajeCredencialesIncorrectas))
        };
    }

    /// <summary>Cambia la contraseña del usuario autenticado.</summary>
    /// <remarks>
    /// @pre token válido y request cumple <see cref="ChangePasswordRequest"/>.
    /// @post 204 si se cambió; 400 si la contraseña actual no coincide; 401 sin sesión válida.
    /// </remarks>
    [HttpPut("password")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ChangePassword(
        [FromBody] ChangePasswordRequest request,
        CancellationToken cancellationToken)
    {
        if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var usuarioId) || usuarioId <= 0)
            return Unauthorized();

        return await auth.CambiarPasswordAsync(usuarioId, request.PasswordActual, request.PasswordNueva, cancellationToken) switch
        {
            PasswordChangeStatus.Cambiada => NoContent(),
            PasswordChangeStatus.PasswordActualIncorrecta =>
                BadRequest(new ErrorResponse("La contraseña actual no es correcta.")),
            _ => Unauthorized()
        };
    }

    private ObjectResult Prohibido(string mensaje) =>
        StatusCode(StatusCodes.Status403Forbidden, new ErrorResponse(mensaje));
}
