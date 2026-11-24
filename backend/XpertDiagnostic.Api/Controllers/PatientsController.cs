using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using XpertDiagnostic.Api.Configuration;
using XpertDiagnostic.Api.Models.DTOs;
using XpertDiagnostic.Api.Models.Results;
using XpertDiagnostic.Api.Services.Interfaces;

namespace XpertDiagnostic.Api.Controllers;

/// <summary>
/// Pacientes (ESP-004). Solo traduce HTTP ↔ servicio; la lógica vive en <see cref="IPatientService"/>.
/// Exige un token válido de médico (401 si falta o expiró; 403 si es de administrador, P-116).
/// </summary>
[ApiController]
[Route("api/patients")]
[Produces("application/json")]
[Authorize(Roles = UserRoles.RolesMedicos)]
public class PatientsController(IPatientService pacientes) : ControllerBase
{
    /// <summary>Pacientes registrados para el buscador.</summary>
    /// <remarks>@post 200 con la lista (puede estar vacía).</remarks>
    [HttpGet]
    [ProducesResponseType<IReadOnlyList<PatientSummary>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<IReadOnlyList<PatientSummary>>> List(CancellationToken cancellationToken) =>
        Ok(await pacientes.ListarAsync(cancellationToken));

    /// <summary>Registra un paciente con nombre, sexo y fecha de nacimiento; el servidor calcula la edad y asigna el IdPaciente.</summary>
    /// <remarks>
    /// @pre request cumple las reglas de <see cref="CreatePatientRequest"/> (lo garantiza la validación del modelo).
    /// @post 201 con el paciente creado; 400 si los datos no cumplen las reglas.
    /// </remarks>
    [HttpPost]
    [ProducesResponseType<PatientSummary>(StatusCodes.Status201Created)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<PatientSummary>> Create(
        [FromBody] CreatePatientRequest request,
        CancellationToken cancellationToken)
    {
        var paciente = await pacientes.RegistrarAsync(request, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, paciente);
    }
}
