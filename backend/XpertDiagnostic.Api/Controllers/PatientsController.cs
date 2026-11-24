using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using XpertDiagnostic.Api.Configuration;
using XpertDiagnostic.Api.Models.DTOs;
using XpertDiagnostic.Api.Models.Results;
using XpertDiagnostic.Api.Services.Interfaces;

namespace XpertDiagnostic.Api.Controllers;

/// <summary>
/// Pacientes (ESP-004). Solo traduce HTTP ↔ servicio; la lógica vive en <see cref="IPatientService"/>.
/// Permisos por rol (P-144): todos consultan la lista; solo el administrador da de alta y elimina.
/// 401 si el token falta o expiró; 403 si el rol no tiene permiso.
/// </summary>
[ApiController]
[Route("api/patients")]
[Produces("application/json")]
[Authorize(Roles = UserRoles.Todos)]
public class PatientsController(IPatientService pacientes) : ControllerBase
{
    /// <summary>Pacientes registrados para el buscador y para el panel de administración.</summary>
    /// <remarks>@post 200 con la lista (puede estar vacía).</remarks>
    [HttpGet]
    [ProducesResponseType<IReadOnlyList<PatientSummary>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<IReadOnlyList<PatientSummary>>> List(CancellationToken cancellationToken) =>
        Ok(await pacientes.ListarAsync(cancellationToken));

    /// <summary>Registra un paciente con nombre(s), apellidos, fecha de nacimiento y sexo; el servidor asigna el IdPaciente. Solo administrador.</summary>
    /// <remarks>
    /// @pre request cumple las reglas de <see cref="CreatePatientRequest"/> (lo garantiza la validación del modelo).
    /// @post 201 con el paciente creado; 400 si los datos no cumplen las reglas; 403 si no es administrador.
    /// </remarks>
    [HttpPost]
    [Authorize(Roles = UserRoles.Administrador)]
    [ProducesResponseType<PatientSummary>(StatusCodes.Status201Created)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<PatientSummary>> Create(
        [FromBody] CreatePatientRequest request,
        CancellationToken cancellationToken)
    {
        var paciente = await pacientes.RegistrarAsync(request, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, paciente);
    }

    /// <summary>Elimina de forma definitiva al paciente y su expediente. Solo administrador.</summary>
    /// <remarks>@post 204 si se borró; 404 si no existe; 403 si no es administrador.</remarks>
    [HttpDelete("{idPaciente}")]
    [Authorize(Roles = UserRoles.Administrador)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(string idPaciente, CancellationToken cancellationToken) =>
        await pacientes.EliminarAsync(idPaciente, cancellationToken)
            ? NoContent()
            : NotFound(new ErrorResponse("No existe ese paciente."));
}
