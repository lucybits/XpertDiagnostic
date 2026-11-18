using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using XpertDiagnostic.Api.Configuration;
using XpertDiagnostic.Api.Models.DTOs;
using XpertDiagnostic.Api.Models.Results;
using XpertDiagnostic.Api.Services.Interfaces;

namespace XpertDiagnostic.Api.Controllers;

/// <summary>
/// Interfaz de salida del expediente (P-105): resultado, diagnóstico confirmado, tratamiento y plan.
/// Solo traduce HTTP ↔ servicio; exige token.
/// </summary>
[ApiController]
[Route("api/patients/{idPaciente}")]
[Produces("application/json")]
[Authorize(Roles = UserRoles.Medico)]
public class PatientResultController(IPatientResultService resultados) : ControllerBase
{
    /// <summary>Entradas capturadas y salidas guardadas del paciente.</summary>
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

    /// <summary>Confirma la enfermedad diagnosticada (la elige el médico a partir del análisis).</summary>
    [HttpPut("diagnosis")]
    [ProducesResponseType<PatientResult>(StatusCodes.Status200OK)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PatientResult>> ConfirmDiagnosis(
        string idPaciente,
        [FromBody] ConfirmDiagnosisRequest request,
        CancellationToken cancellationToken) =>
        await Responder(idPaciente, await resultados.ConfirmarDiagnosticoAsync(idPaciente, request.IdEnfermedad, cancellationToken), cancellationToken);

    /// <summary>Guarda el tratamiento indicado (uno de los de la enfermedad diagnosticada).</summary>
    [HttpPut("treatment")]
    [ProducesResponseType<PatientResult>(StatusCodes.Status200OK)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<PatientResult>> ChooseTreatment(
        string idPaciente,
        [FromBody] ChooseTreatmentRequest request,
        CancellationToken cancellationToken) =>
        await Responder(idPaciente, await resultados.ElegirTratamientoAsync(idPaciente, request.IdTratamiento, cancellationToken), cancellationToken);

    /// <summary>Guarda el plan, pronóstico y seguimiento escritos por el médico.</summary>
    [HttpPut("plan")]
    [ProducesResponseType<PatientResult>(StatusCodes.Status200OK)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PatientResult>> SavePlan(
        string idPaciente,
        [FromBody] SaveCarePlanRequest request,
        CancellationToken cancellationToken) =>
        await Responder(idPaciente, await resultados.GuardarPlanAsync(idPaciente, request, cancellationToken), cancellationToken);

    private async Task<ActionResult<PatientResult>> Responder(
        string idPaciente,
        SaveResultStatus estado,
        CancellationToken cancellationToken) =>
        estado switch
        {
            SaveResultStatus.PacienteNoExiste => NotFound(new ErrorResponse("No existe ese paciente.")),
            SaveResultStatus.DatoInvalido => BadRequest(new ErrorResponse("El dato no corresponde a la base de conocimiento.")),
            SaveResultStatus.SinDiagnostico => Conflict(new ErrorResponse("Primero confirma el diagnóstico.")),
            _ => Ok(await resultados.ObtenerAsync(idPaciente, cancellationToken)),
        };
}
