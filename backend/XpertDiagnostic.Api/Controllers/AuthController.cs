
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using XpertDiagnostic.Api.Models.DTOs;
using XpertDiagnostic.Api.Services.Interfaces;

namespace XpertDiagnostic.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(
    IAuthService auth,
    ILogger<AuthController> logger
) : ControllerBase
{
    [HttpPost("login")]
    public async Task<IActionResult> Login(
        [FromBody] LoginRequest request)
    {
        if (request.UsuarioId <= 0 ||
            string.IsNullOrWhiteSpace(request.Password) ||
            request.Password.Length > 72)
        {
            return BadRequest(new {
                error = "Datos inválidos"
            });
        }

        try
        {
            var respuesta = await auth.LoginAsync(
                request.UsuarioId,
                request.Password
            );

            if (respuesta is null)
            {
                return Unauthorized(new {
                    error = "ID o contraseña incorrectos. Vuelve a intentarlo."
                });
            }

            return Ok(respuesta);
        }
        catch (SqlException ex)
        {
            logger.LogError(ex, "Error de conexión con SQL Server");

            return StatusCode(503, new {
                error = "No se pudo iniciar sesión. Inténtalo de nuevo."
            });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error inesperado durante el login");

            return StatusCode(500, new {
                error = "Error interno del servidor"
            });
        }
    }
}
