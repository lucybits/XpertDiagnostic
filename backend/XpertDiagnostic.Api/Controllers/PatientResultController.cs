using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using XpertDiagnostic.Api.Configuration;
using XpertDiagnostic.Api.Models.DTOs;
using XpertDiagnostic.Api.Models.Entities;
using XpertDiagnostic.Api.Models.Results;
using XpertDiagnostic.Api.Services.Interfaces;

namespace XpertDiagnostic.Api.Controllers;

/// <summary>
/// Interfaz de salida del expediente (P-105): resultado, diagnóstico confirmado, tratamiento y plan.
/// Solo traduce HTTP ↔ servicio; exige token.
/// Flujo de validación (P-145): el tratante confirma el diagnóstico (queda "Pendiente") y el internista
/// lo valida. Hasta entonces el tratante no puede abrir la interfaz de salida ni editar tratamiento o
/// plan (409); el internista sí, porque es quien revisa.
/// </summary>
[ApiController]
[Route("api/patients/{idPaciente}")]
[Produces("application/json")]
[Authorize(Roles = UserRoles.RolesMedicos)]
public class PatientResultController(IPatientResultService resultados) : ControllerBase
{
    private const string MensajeNoExiste = "No existe ese paciente.";
    private const string MensajePendiente =
        "El diagnóstico todavía no está validado por el médico internista. Podrás ver el resultado cuando lo valide.";

    /// <summary>Entradas capturadas y salidas guardadas del paciente.</summary>
    /// <remarks>@post 200 con el resultado; 404 si el paciente no existe; 409 si el tratante lo pide antes de la validación.</remarks>
    [HttpGet("result")]
    [ProducesResponseType<PatientResult>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<PatientResult>> Get(string idPaciente, CancellationToken cancellationToken)
    {
        var resultado = await resultados.ObtenerAsync(idPaciente, cancellationToken);
        if (resultado is null) return NotFound(new ErrorResponse(MensajeNoExiste));
        if (TratanteSinValidacion(resultado)) return Conflict(new ErrorResponse(MensajePendiente));
        return Ok(resultado);
    }

    /// <summary>
    /// Confirma la enfermedad diagnosticada (la elige el tratante a partir del análisis) y la envía a
    /// validación del internista (P-145). Devuelve el expediente, no la salida: la salida se ve hasta validar.
    /// </summary>
    /// <remarks>@post 200 con el expediente (EstadoValidacion = "Pendiente"); 400 si la enfermedad no existe; 404 si el paciente no existe.</remarks>
    [HttpPut("diagnosis")]
    [Authorize(Roles = UserRoles.MedicoTratante)]
    [ProducesResponseType<PatientRecord>(StatusCodes.Status200OK)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PatientRecord>> ConfirmDiagnosis(
        string idPaciente,
        [FromBody] ConfirmDiagnosisRequest request,
        CancellationToken cancellationToken)
    {
        switch (await resultados.ConfirmarDiagnosticoAsync(idPaciente, request.IdEnfermedad, cancellationToken))
        {
            case SaveResultStatus.PacienteNoExiste: return NotFound(new ErrorResponse(MensajeNoExiste));
            case SaveResultStatus.DatoInvalido: return BadRequest(new ErrorResponse("El dato no corresponde a la base de conocimiento."));
        }
        var resultado = await resultados.ObtenerAsync(idPaciente, cancellationToken);
        return resultado is null ? NotFound(new ErrorResponse(MensajeNoExiste)) : Ok(resultado.Expediente);
    }

    /// <summary>El internista valida el diagnóstico pendiente (P-145). La pantalla del internista está aplazada.</summary>
    /// <remarks>@post 200 con el resultado validado; 404 si no existe; 409 si no hay un diagnóstico pendiente.</remarks>
    [HttpPut("validation")]
    [Authorize(Roles = UserRoles.MedicoInternista)]
    [ProducesResponseType<PatientResult>(StatusCodes.Status200OK)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<PatientResult>> Validate(string idPaciente, CancellationToken cancellationToken) =>
        await resultados.ValidarAsync(idPaciente, cancellationToken) switch
        {
            SaveResultStatus.PacienteNoExiste => NotFound(new ErrorResponse(MensajeNoExiste)),
            SaveResultStatus.SinDiagnostico => Conflict(new ErrorResponse("No hay un diagnóstico pendiente de validación.")),
            _ => Ok(await resultados.ObtenerAsync(idPaciente, cancellationToken)),
        };

    /// <summary>Guarda el tratamiento indicado (uno de los de la enfermedad diagnosticada).</summary>
    [HttpPut("treatment")]
    [ProducesResponseType<PatientResult>(StatusCodes.Status200OK)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<PatientResult>> ChooseTreatment(
        string idPaciente,
        [FromBody] ChooseTreatmentRequest request,
        CancellationToken cancellationToken)
    {
        if (await BloqueadoParaTratante(idPaciente, cancellationToken) is { } bloqueo) return bloqueo;
        return await Responder(idPaciente, await resultados.ElegirTratamientoAsync(idPaciente, request.IdTratamiento, cancellationToken), cancellationToken);
    }

    /// <summary>Guarda el plan, pronóstico y seguimiento escritos por el médico.</summary>
    [HttpPut("plan")]
    [ProducesResponseType<PatientResult>(StatusCodes.Status200OK)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<PatientResult>> SavePlan(
        string idPaciente,
        [FromBody] SaveCarePlanRequest request,
        CancellationToken cancellationToken)
    {
        if (await BloqueadoParaTratante(idPaciente, cancellationToken) is { } bloqueo) return bloqueo;
        return await Responder(idPaciente, await resultados.GuardarPlanAsync(idPaciente, request, cancellationToken), cancellationToken);
    }

    /// <summary>El tratante solo ve la salida de un diagnóstico ya validado (P-145).</summary>
    private bool TratanteSinValidacion(PatientResult resultado) =>
        User.IsInRole(UserRoles.MedicoTratante) && resultado.Expediente.EstadoValidacion != PatientValidation.Validado;

    /// <summary>404 o 409 si el tratante intenta editar la salida antes de la validación; null si puede seguir.</summary>
    /// <remarks>
    /// Devuelve ActionResult (no ActionResult&lt;T&gt;): convertir null a ActionResult&lt;T&gt; lanza
    /// ArgumentNullException, y aquí null significa "puede seguir".
    /// </remarks>
    private async Task<ActionResult?> BloqueadoParaTratante(string idPaciente, CancellationToken cancellationToken)
    {
        if (!User.IsInRole(UserRoles.MedicoTratante)) return null;
        var resultado = await resultados.ObtenerAsync(idPaciente, cancellationToken);
        if (resultado is null) return NotFound(new ErrorResponse(MensajeNoExiste));
        if (TratanteSinValidacion(resultado)) return Conflict(new ErrorResponse(MensajePendiente));
        return null;
    }

    private async Task<ActionResult<PatientResult>> Responder(
        string idPaciente,
        SaveResultStatus estado,
        CancellationToken cancellationToken)
    {
        switch (estado)
        {
            case SaveResultStatus.PacienteNoExiste: return NotFound(new ErrorResponse(MensajeNoExiste));
            case SaveResultStatus.DatoInvalido: return BadRequest(new ErrorResponse("El dato no corresponde a la base de conocimiento."));
            case SaveResultStatus.SinDiagnostico: return Conflict(new ErrorResponse("Primero confirma el diagnóstico."));
        }

        var resultado = await resultados.ObtenerAsync(idPaciente, cancellationToken);
        if (resultado is null) return NotFound(new ErrorResponse(MensajeNoExiste));
        if (TratanteSinValidacion(resultado)) return Conflict(new ErrorResponse(MensajePendiente));
        return Ok(resultado);
    }
}
