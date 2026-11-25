using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using XpertDiagnostic.Api.Configuration;
using XpertDiagnostic.Api.Models.DTOs;
using XpertDiagnostic.Api.Models.Results;
using XpertDiagnostic.Api.Services.Interfaces;

namespace XpertDiagnostic.Api.Controllers;

/// <summary>
/// Validación del diagnóstico por el médico internista (P-151). Solo traduce HTTP ↔ servicio.
/// Permisos: el médico tratante envía y consulta el estado de su paciente; el médico internista lista,
/// revisa y confirma. El ID del médico se toma del token, nunca del cuerpo.
/// </summary>
[ApiController]
[Produces("application/json")]
public class DiagnosisValidationController(IDiagnosisValidationService validaciones) : ControllerBase
{
    /// <summary>Estado de la validación del paciente (para el aviso del tratante).</summary>
    /// <remarks>@post 200 con el estado; 404 si el paciente no existe.</remarks>
    [HttpGet("api/patients/{idPaciente}/validation")]
    [Authorize(Roles = UserRoles.RolesMedicos)]
    [ProducesResponseType<ValidationSummary>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ValidationSummary>> GetStatus(string idPaciente, CancellationToken cancellationToken)
    {
        var estado = await validaciones.ObtenerEstadoAsync(idPaciente, cancellationToken);
        return estado is null ? NotFound(new ErrorResponse("No existe ese paciente.")) : Ok(estado);
    }

    /// <summary>El médico tratante envía el diagnóstico diferencial al médico internista.</summary>
    /// <remarks>
    /// @post 200 con el estado (pendiente); 404 si el paciente no existe; 409 si el análisis no tiene
    ///       candidatos; 403 si no es médico tratante.
    /// </remarks>
    [HttpPost("api/patients/{idPaciente}/validation")]
    [Authorize(Roles = UserRoles.MedicoTratante)]
    [ProducesResponseType<ValidationSummary>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ValidationSummary>> Send(string idPaciente, CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var idTratante)) return Unauthorized();
        var estado = await validaciones.SolicitarAsync(idPaciente, idTratante, cancellationToken);
        return await Responder(idPaciente, estado, cancellationToken);
    }

    /// <summary>Pacientes pendientes ("P", por defecto) o confirmados ("C") para el médico internista.</summary>
    /// <remarks>@post 200 con la lista (puede estar vacía); 400 si el estado no es P ni C.</remarks>
    [HttpGet("api/validations")]
    [Authorize(Roles = UserRoles.MedicoInternista)]
    [ProducesResponseType<IReadOnlyList<ValidationSummary>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<IReadOnlyList<ValidationSummary>>> List(
        [FromQuery] string estado = ValidationStates.Pendiente,
        CancellationToken cancellationToken = default) =>
        ValidationStates.EsValido(estado)
            ? Ok(await validaciones.ListarAsync(estado, cancellationToken))
            : BadRequest(new ErrorResponse("El estado debe ser P o C."));

    /// <summary>Paciente, hallazgos y diagnóstico diferencial actual, para que el internista decida.</summary>
    /// <remarks>@post 200 con el detalle; 404 si el paciente no existe.</remarks>
    [HttpGet("api/validations/{idPaciente}")]
    [Authorize(Roles = UserRoles.MedicoInternista)]
    [ProducesResponseType<ValidationDetail>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ValidationDetail>> Get(string idPaciente, CancellationToken cancellationToken)
    {
        var detalle = await validaciones.ObtenerDetalleAsync(idPaciente, cancellationToken);
        return detalle is null ? NotFound(new ErrorResponse("No existe ese paciente.")) : Ok(detalle);
    }

    /// <summary>El médico internista confirma uno de los candidatos o corrige el que ya confirmó.</summary>
    /// <remarks>
    /// @post 200 con el estado (confirmado); 400 si la enfermedad no es candidata; 404 si el paciente no
    ///       existe; 409 si el tratante no lo ha enviado; 403 si no es médico internista.
    /// </remarks>
    [HttpPut("api/validations/{idPaciente}")]
    [Authorize(Roles = UserRoles.MedicoInternista)]
    [ProducesResponseType<ValidationSummary>(StatusCodes.Status200OK)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ValidationSummary>> Confirm(
        string idPaciente,
        [FromBody] ConfirmDiagnosisRequest request,
        CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var idInternista)) return Unauthorized();
        var estado = await validaciones.ConfirmarAsync(idPaciente, request.IdEnfermedad, idInternista, cancellationToken);
        return await Responder(idPaciente, estado, cancellationToken);
    }

    private async Task<ActionResult<ValidationSummary>> Responder(
        string idPaciente,
        ValidationStatus estado,
        CancellationToken cancellationToken) =>
        estado switch
        {
            ValidationStatus.PacienteNoExiste => NotFound(new ErrorResponse("No existe ese paciente.")),
            ValidationStatus.SinCandidatos => Conflict(new ErrorResponse("El análisis no tiene candidatos que validar.")),
            ValidationStatus.NoEnviado => Conflict(new ErrorResponse("El médico tratante aún no envía este paciente a validación.")),
            ValidationStatus.EnfermedadNoCandidata => BadRequest(new ErrorResponse("La enfermedad no es uno de los candidatos del análisis.")),
            _ => Ok(await validaciones.ObtenerEstadoAsync(idPaciente, cancellationToken)),
        };

    private bool TryGetUserId(out int usuarioId) =>
        int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out usuarioId) && usuarioId > 0;
}
