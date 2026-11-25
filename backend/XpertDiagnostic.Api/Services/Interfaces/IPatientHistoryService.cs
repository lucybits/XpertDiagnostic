using XpertDiagnostic.Api.Models.DTOs;
using XpertDiagnostic.Api.Models.Results;

namespace XpertDiagnostic.Api.Services.Interfaces;

/// <summary>
/// Interrogatorio del paciente (P-159): antecedentes no patológicos y patológicos. Lo captura el médico
/// tratante antes de la evaluación clínica.
/// </summary>
public interface IPatientHistoryService
{
    /// <summary>Antecedentes guardados del paciente.</summary>
    /// <remarks>@post null si el paciente no existe; cada parte es null si aún no se guarda. No modifica datos.</remarks>
    Task<PatientHistory?> ObtenerAsync(string idPaciente, CancellationToken cancellationToken = default);

    /// <summary>Guarda (crea o reemplaza) los antecedentes no patológicos.</summary>
    /// <remarks>
    /// @pre datos trae las siete respuestas (lo garantiza la validación del modelo).
    /// @post true y queda guardado; false si el paciente no existe (no guarda nada).
    /// </remarks>
    Task<bool> GuardarNoPatologicosAsync(string idPaciente, NonPathologicalHistoryData datos, CancellationToken cancellationToken = default);

    /// <summary>Guarda (crea o reemplaza) los antecedentes patológicos.</summary>
    /// <remarks>
    /// @post true y queda guardado: cada texto sin espacios sobrantes y los vacíos como null; false si el
    ///       paciente no existe (no guarda nada).
    /// </remarks>
    Task<bool> GuardarPatologicosAsync(string idPaciente, PathologicalHistoryData datos, CancellationToken cancellationToken = default);
}
