using XpertDiagnostic.Api.Models.DTOs;
using XpertDiagnostic.Api.Models.Results;

namespace XpertDiagnostic.Api.Services.Interfaces;

/// <summary>Interfaz de salida del expediente (P-105): consultar y confirmar las salidas de PACIENTES.</summary>
public interface IPatientResultService
{
    /// <summary>Entradas capturadas y salidas guardadas del paciente.</summary>
    /// <remarks>@post null si el paciente no existe. No modifica datos.</remarks>
    Task<PatientResult?> ObtenerAsync(string idPaciente, CancellationToken cancellationToken = default);

    /// <summary>Confirma la enfermedad diagnosticada.</summary>
    /// <remarks>
    /// @post Guardado: IdEnfermedadDiagnosticada = idEnfermedad. Si cambió de enfermedad, el tratamiento
    ///       anterior se quita (ya no le corresponde); si es la misma, se conserva. El diagnóstico queda
    ///       "Pendiente" de validación por el internista, aunque antes estuviera validado (P-145).
    /// @post DatoInvalido si la enfermedad no existe; PacienteNoExiste si el paciente no existe.
    /// </remarks>
    Task<SaveResultStatus> ConfirmarDiagnosticoAsync(string idPaciente, string idEnfermedad, CancellationToken cancellationToken = default);

    /// <summary>Guarda el tratamiento que eligió el médico.</summary>
    /// <remarks>
    /// @post SinDiagnostico si aún no hay enfermedad diagnosticada; DatoInvalido si el tratamiento no es
    ///       de esa enfermedad; Guardado en otro caso.
    /// </remarks>
    Task<SaveResultStatus> ElegirTratamientoAsync(string idPaciente, string idTratamiento, CancellationToken cancellationToken = default);

    /// <summary>Guarda el plan escrito por el médico: lo actualiza si existe o lo crea con el siguiente IdPlan.</summary>
    /// <remarks>@post Guardado: el paciente queda con un IdPlan cuyo texto es el enviado (sin espacios sobrantes).</remarks>
    Task<SaveResultStatus> GuardarPlanAsync(string idPaciente, SaveCarePlanRequest plan, CancellationToken cancellationToken = default);

    /// <summary>El internista valida el diagnóstico enviado por el tratante (P-145).</summary>
    /// <remarks>
    /// @post Guardado: queda "Validado". PacienteNoExiste si no existe; SinDiagnostico si no estaba
    ///       "Pendiente" (no hay nada que validar). No cambia nada en esos casos.
    /// </remarks>
    Task<SaveResultStatus> ValidarAsync(string idPaciente, CancellationToken cancellationToken = default);
}
