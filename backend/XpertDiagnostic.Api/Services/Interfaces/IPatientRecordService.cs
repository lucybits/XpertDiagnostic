using XpertDiagnostic.Api.Models.DTOs;
using XpertDiagnostic.Api.Models.Results;

namespace XpertDiagnostic.Api.Services.Interfaces;

/// <summary>Captura del expediente: hallazgos por sección y enfermedad preexistente (P-103).</summary>
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

    /// <summary>Asigna (o quita) la enfermedad preexistente del paciente.</summary>
    /// <remarks>@post RegistroInvalido si la enfermedad no existe; PacienteNoExiste si el paciente no existe.</remarks>
    Task<SaveFindingsStatus> AsignarPreexistenteAsync(
        string idPaciente,
        string? idEnfermedad,
        CancellationToken cancellationToken = default);
}
