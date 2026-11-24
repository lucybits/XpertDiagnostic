using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using XpertDiagnostic.Api.Configuration;
using XpertDiagnostic.Api.Models.DTOs;
using XpertDiagnostic.Api.Models.Results;
using XpertDiagnostic.Api.Services.Interfaces;

namespace XpertDiagnostic.Api.Controllers;

/// <summary>
/// Captura del expediente de un paciente (P-103): hallazgos por sección y enfermedad preexistente.
/// Solo traduce HTTP ↔ servicio; exige token.
/// </summary>
[ApiController]
[Route("api/patients/{idPaciente}")]
[Produces("application/json")]
[Authorize(Roles = UserRoles.RolesMedicos)]
public class PatientRecordController(IPatientRecordService expedientes, IDiagnosisService diagnosticos) : ControllerBase
{
    /// <summary>Expediente capturado: enfermedad preexistente y hallazgos.</summary>
    /// <remarks>@post 200 con el expediente; 404 si el paciente no existe.</remarks>
    [HttpGet("record")]
    [ProducesResponseType<PatientRecord>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PatientRecord>> Get(string idPaciente, CancellationToken cancellationToken)
    {
        var expediente = await expedientes.ObtenerAsync(idPaciente, cancellationToken);
        return expediente is null ? NotFound(new ErrorResponse("No existe ese paciente.")) : Ok(expediente);
    }

    /// <summary>Guarda los hallazgos de una sección (reemplaza los anteriores de ese tipo).</summary>
    /// <remarks>
    /// @pre seccion es sintomas, signos, estudios-laboratorio o comorbilidades.
    /// @post 200 con el expediente actualizado; 400 si algún registro no es del catálogo; 404 si el
    ///       paciente o la sección no existen.
    /// </remarks>
    [HttpPut("findings/{seccion}")]
    [ProducesResponseType<PatientRecord>(StatusCodes.Status200OK)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PatientRecord>> SaveFindings(
        string idPaciente,
        string seccion,
        [FromBody] SaveFindingsRequest request,
        CancellationToken cancellationToken)
    {
        if (!expedientes.TryParseSeccion(seccion, out var catalogo))
            return NotFound(new ErrorResponse("No existe esa sección."));

        var estado = await expedientes.GuardarHallazgosAsync(idPaciente, catalogo, request.Hallazgos, cancellationToken);
        return await Responder(idPaciente, estado, cancellationToken);
    }

    /// <summary>Asigna o quita la enfermedad preexistente.</summary>
    /// <remarks>@post 200 con el expediente; 400 si la enfermedad no existe; 404 si el paciente no existe.</remarks>
    [HttpPut("preexisting-disease")]
    [ProducesResponseType<PatientRecord>(StatusCodes.Status200OK)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PatientRecord>> SetPreexisting(
        string idPaciente,
        [FromBody] SetPreexistingDiseaseRequest request,
        CancellationToken cancellationToken)
    {
        var estado = await expedientes.AsignarPreexistenteAsync(idPaciente, request.IdEnfermedad, cancellationToken);
        return await Responder(idPaciente, estado, cancellationToken);
    }

    /// <summary>Analiza los hallazgos guardados con la máquina de inferencia registrada.</summary>
    /// <remarks>@post 200 con el diagnóstico diferencial (puede no tener candidatos); 404 si el paciente no existe.</remarks>
    [HttpPost("analysis")]
    [ProducesResponseType<DiagnosisResult>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<DiagnosisResult>> Analyze(string idPaciente, CancellationToken cancellationToken)
    {
        var resultado = await diagnosticos.AnalizarAsync(idPaciente, cancellationToken);
        return resultado is null ? NotFound(new ErrorResponse("No existe ese paciente.")) : Ok(resultado);
    }

    private async Task<ActionResult<PatientRecord>> Responder(
        string idPaciente,
        SaveFindingsStatus estado,
        CancellationToken cancellationToken) =>
        estado switch
        {
            SaveFindingsStatus.PacienteNoExiste => NotFound(new ErrorResponse("No existe ese paciente.")),
            SaveFindingsStatus.RegistroInvalido => BadRequest(new ErrorResponse("Algún elemento no es del catálogo.")),
            _ => Ok(await expedientes.ObtenerAsync(idPaciente, cancellationToken)),
        };
}
