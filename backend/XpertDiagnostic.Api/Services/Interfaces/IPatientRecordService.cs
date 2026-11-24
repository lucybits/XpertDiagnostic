using XpertDiagnostic.Api.Models.DTOs;
using XpertDiagnostic.Api.Models.Results;

namespace XpertDiagnostic.Api.Services.Interfaces;

/// <summary>Captura del expediente: hallazgos por sección (P-103).</summary>
public interface IPatientRecordService
{
    /// <summary>Convierte el nombre de la URL en el catálogo de una sección con hallazgos.</summary>
    /// <remarks>@post true solo para sintomas, signos, estudios-laboratorio y comorbilidades.</remarks>
    bool TryParseSeccion(string nombre, out CatalogType catalogo);

    /// <summary>Expediente capturado, con los hallazgos equivalentes agrupados por descripción.</summary>
    /// <remarks>@post null si el paciente no existe. No modifica datos.</remarks>
    Task<PatientRecord?> ObtenerAsync(string idPaciente, CancellationToken cancellationToken = default);

    /// <summary>Guarda los hallazgos de una sección, reemplazando los anteriores de ese tipo.</summary>
    /// <remarks>
    /// @pre catalogo es de una sección con hallazgos (TryParseSeccion).
    /// @post Guardado: por cada elegido se guardan todos los IdRegistro del catálogo con la misma
    ///       descripción (decisión de Lucía, P-103), con su valor ("presente" o la medición y sus unidades).
    /// @post PacienteNoExiste o RegistroInvalido: no se modificó nada.
    /// </remarks>
    Task<SaveFindingsStatus> GuardarHallazgosAsync(
        string idPaciente,
        CatalogType catalogo,
        IReadOnlyList<FindingInput> hallazgos,
        CancellationToken cancellationToken = default);

    /// <summary>Guarda las respuestas de antecedentes no patológicos del interrogatorio (P-145).</summary>
    /// <remarks>@post Guardado (crea o reemplaza la fila) o PacienteNoExiste sin cambios.</remarks>
    Task<SaveFindingsStatus> GuardarAntecedentesNoPatologicosAsync(
        string idPaciente,
        SaveNonPathologicalHistoryRequest respuestas,
        CancellationToken cancellationToken = default);

    /// <summary>Guarda la hipótesis diagnóstica inicial (con espacios normalizados en los extremos), P-145.</summary>
    /// <remarks>@pre hipotesis cumple <see cref="SaveHypothesisRequest"/>. @post Guardado o PacienteNoExiste sin cambios.</remarks>
    Task<SaveFindingsStatus> GuardarHipotesisAsync(
        string idPaciente,
        string hipotesis,
        CancellationToken cancellationToken = default);
}