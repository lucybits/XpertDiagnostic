using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using XpertDiagnostic.Api.Models.DTOs;
using XpertDiagnostic.Api.Models.Results;
using XpertDiagnostic.Api.Services.Interfaces;

namespace XpertDiagnostic.Api.Controllers;

/// <summary>
/// Cuenta del usuario autenticado (médico o administrador). Solo traduce HTTP ↔ servicio; la lógica
/// vive en <see cref="IDoctorService"/>. Todas las acciones exigen un token válido (401 si falta o expiró).
/// El alta y la gestión de médicos están en <see cref="AdminDoctorsController"/> (P-116).
/// </summary>
[ApiController]
[Route("api/doctors")]
[Produces("application/json")]
[Authorize]
public class DoctorsController(IDoctorService medicos) : ControllerBase
{
    /// <summary>Perfil del usuario autenticado: ID, rol, nombre y especialidad.</summary>
    /// <remarks>
    /// @post 200 con <see cref="DoctorProfile"/>; 404 si la cuenta del token ya no existe.
    /// </remarks>
    [HttpGet("me")]
    [ProducesResponseType<DoctorProfile>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<DoctorProfile>> Me(CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var usuarioId))
            return Unauthorized();

        var perfil = await medicos.ObtenerPerfilAsync(usuarioId, cancellationToken);
        return perfil is null
            ? NotFound(new ErrorResponse("No se encontró la cuenta."))
            : Ok(perfil);
    }

    /// <summary>Marca que el usuario autenticado completó la bienvenida guiada (ESP-003).</summary>
    /// <remarks>@post 204 si se marcó (repetirlo no cambia nada); 404 si la cuenta del token ya no existe.</remarks>
    [HttpPost("me/welcome")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> MarkWelcomeSeen(CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var usuarioId))
            return Unauthorized();

        return await medicos.MarcarBienvenidaVistaAsync(usuarioId, cancellationToken)
            ? NoContent()
            : NotFound(new ErrorResponse("No se encontró la cuenta."));
    }

    /// <summary>ID del usuario tomado del token (claim NameIdentifier).</summary>
    private bool TryGetUserId(out int usuarioId) =>
        int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out usuarioId) && usuarioId > 0;
}
