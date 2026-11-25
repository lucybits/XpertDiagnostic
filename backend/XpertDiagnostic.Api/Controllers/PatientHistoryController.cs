using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using XpertDiagnostic.Api.Configuration;
using XpertDiagnostic.Api.Models.DTOs;
using XpertDiagnostic.Api.Models.Results;
using XpertDiagnostic.Api.Services.Interfaces;

namespace XpertDiagnostic.Api.Controllers;

/// <summary>
/// Interrogatorio del paciente (P-159): antecedentes no patológicos y patológicos. Solo traduce HTTP ↔
/// servicio. Los médicos consultan; solo el médico tratante guarda.
/// </summary>
[ApiController]
[Route("api/patients/{idPaciente}/history")]
[Produces("application/json")]
[Authorize(Roles = UserRoles.RolesMedicos)]
public class PatientHistoryController(IPatientHistoryService antecedentes) : ControllerBase
{
    /// <summary>Antecedentes guardados del paciente.</summary>
    /// <remarks>@post 200 con el interrogatorio (cada parte null si aún no se guarda); 404 si el paciente no existe.</remarks>
    [HttpGet]
    [ProducesResponseType<PatientHistory>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PatientHistory>> Get(string idPaciente, CancellationToken cancellationToken)
    {
        var historia = await antecedentes.ObtenerAsync(idPaciente, cancellationToken);
        return historia is null ? NotFound(new ErrorResponse("No existe ese paciente.")) : Ok(historia);
    }

    /// <summary>Guarda los antecedentes no patológicos (siete respuestas sí/no). Solo médico tratante.</summary>
    /// <remarks>@post 200 con el interrogatorio actualizado; 400 si falta una respuesta; 404 si el paciente no existe.</remarks>
    [HttpPut("no-patologicos")]
    [Authorize(Roles = UserRoles.MedicoTratante)]
    [ProducesResponseType<PatientHistory>(StatusCodes.Status200OK)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PatientHistory>> SaveNonPathological(
        string idPaciente,
        [FromBody] NonPathologicalHistoryData request,
        CancellationToken cancellationToken) =>
        await antecedentes.GuardarNoPatologicosAsync(idPaciente, request, cancellationToken)
            ? Ok(await antecedentes.ObtenerAsync(idPaciente, cancellationToken))
            : NotFound(new ErrorResponse("No existe ese paciente."));

    /// <summary>Guarda los antecedentes patológicos (texto libre, vacío = sin registrar). Solo médico tratante.</summary>
    /// <remarks>@post 200 con el interrogatorio actualizado; 400 si un texto pasa de 255 caracteres; 404 si el paciente no existe.</remarks>
    [HttpPut("patologicos")]
    [Authorize(Roles = UserRoles.MedicoTratante)]
    [ProducesResponseType<PatientHistory>(StatusCodes.Status200OK)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PatientHistory>> SavePathological(
        string idPaciente,
        [FromBody] PathologicalHistoryData request,
        CancellationToken cancellationToken) =>
        await antecedentes.GuardarPatologicosAsync(idPaciente, request, cancellationToken)
            ? Ok(await antecedentes.ObtenerAsync(idPaciente, cancellationToken))
            : NotFound(new ErrorResponse("No existe ese paciente."));
}
