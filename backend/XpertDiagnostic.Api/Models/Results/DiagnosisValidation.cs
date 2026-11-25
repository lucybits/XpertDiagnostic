namespace XpertDiagnostic.Api.Models.Results;

/// <summary>
/// Estado de la validación del diagnóstico de un paciente (P-151), para la lista del médico internista y
/// para el aviso del médico tratante.
/// </summary>
/// <remarks>
/// @inv Estado es null (sin enviar), "P" (pendiente) o "C" (confirmado); ver ValidationStates.
/// @inv Estado == "C" ⇒ Diagnostico no es null.
/// @inv Solicitante y Validador son nombres de médico, o null si ya no existe la cuenta.
/// </remarks>
public sealed record ValidationSummary(
    string IdPaciente,
    string NombreCompleto,
    int Edad,
    string Sexo,
    string? Estado,
    string? Solicitante,
    DateTime? FechaSolicitud,
    string? Validador,
    DateTime? FechaValidacion,
    string? Diagnostico);

/// <summary>Lo que revisa el internista antes de confirmar: el paciente, sus hallazgos y el diagnóstico diferencial.</summary>
/// <remarks>@inv Analisis es el resultado actual de la máquina de inferencia con los hallazgos guardados.</remarks>
public sealed record ValidationDetail(ValidationSummary Paciente, PatientRecord Expediente, DiagnosisResult Analisis);

/// <summary>Resultado de enviar o confirmar una validación.</summary>
public enum ValidationStatus
{
    /// <summary>Se guardó el envío o la confirmación.</summary>
    Guardado,
    PacienteNoExiste,

    /// <summary>El análisis no tiene candidatos: no hay nada que validar.</summary>
    SinCandidatos,

    /// <summary>El médico tratante aún no lo envía a validación.</summary>
    NoEnviado,

    /// <summary>La enfermedad no es uno de los candidatos del análisis actual.</summary>
    EnfermedadNoCandidata
}
