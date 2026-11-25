using XpertDiagnostic.Api.Models.Results;

namespace XpertDiagnostic.Api.Services.Interfaces;

/// <summary>
/// Interfaz de salida del expediente (P-105). Solo lectura (P-164): el diagnóstico lo confirma el médico
/// internista (IDiagnosisValidationService, P-151) y el tratamiento y el plan salen de la base de
/// conocimiento para esa enfermedad; nadie los escribe a mano.
/// </summary>
public interface IPatientResultService
{
    /// <summary>Entradas capturadas y salidas del paciente.</summary>
    /// <remarks>
    /// @post null si el paciente no existe. No modifica datos.
    /// @post Sin confirmación del internista no hay diagnóstico, tratamiento ni plan.
    /// @post Con confirmación: el tratamiento indicado es el primero de la enfermedad (inference_engine.prg) y
    ///       el plan indicado lista sus tratamientos.
    /// </remarks>
    Task<PatientResult?> ObtenerAsync(string idPaciente, CancellationToken cancellationToken = default);
}
