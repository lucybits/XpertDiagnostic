using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using XpertDiagnostic.Api.Configuration;
using XpertDiagnostic.Api.Models.DTOs;
using XpertDiagnostic.Api.Models.Results;
using XpertDiagnostic.Api.Services.Interfaces;

namespace XpertDiagnostic.Api.Controllers;

/// <summary>
/// Interfaz de salida del expediente (P-105): resultado, diagnóstico confirmado, tratamiento y plan.
/// Solo traduce HTTP ↔ servicio; exige token. Es de solo lectura (P-164): el diagnóstico lo confirma el
/// médico internista (<see cref="DiagnosisValidationController"/>) y el tratamiento y el plan salen de la
/// base de conocimiento, así que ya no hay PUT de tratamiento ni de plan.
/// </summary>
[ApiController]
[Route("api/patients/{idPaciente}")]
[Produces("application/json")]
[Authorize(Roles = UserRoles.RolesMedicos)]
public class PatientResultController(IPatientResultService resultados) : ControllerBase
{
    /// <summary>Entradas capturadas y salidas del paciente (solo con diagnóstico confirmado).</summary>
    /// <remarks>@post 200 con el resultado; 404 si el paciente no existe.</remarks>
    [HttpGet("result")]
    [ProducesResponseType<PatientResult>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PatientResult>> Get(string idPaciente, CancellationToken cancellationToken)
    {
        var resultado = await resultados.ObtenerAsync(idPaciente, cancellationToken);
        return resultado is null ? NotFound(new ErrorResponse("No existe ese paciente.")) : Ok(resultado);
    }
}
