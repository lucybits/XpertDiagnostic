namespace XpertDiagnostic.Api.Models.Results;

/// <summary>Un tratamiento de la enfermedad diagnosticada, para elegir el indicado.</summary>
public sealed record TreatmentView(string IdTratamiento, string Descripcion, decimal? DosisMinima, decimal? DosisMaxima, string? Unidades);

/// <summary>Plan, pronóstico (expectativa) y seguimiento del paciente.</summary>
public sealed record CarePlanView(string IdPlan, string PlanIndicado, string? Pronostico, string? Seguimiento);

/// <summary>
/// Interfaz de salida del expediente (P-105): las entradas capturadas y las salidas de PACIENTES
/// (enfermedad diagnosticada, tratamiento y plan).
/// </summary>
/// <remarks>
/// @inv Tratamientos son los de la enfermedad diagnosticada (vacío si aún no hay diagnóstico).
/// @inv IdTratamiento, si existe, es uno de Tratamientos.
/// </remarks>
public sealed record PatientResult(
    PatientSummary Paciente,
    PatientRecord Expediente,
    string? IdEnfermedadDiagnosticada,
    string? EnfermedadDiagnosticada,
    IReadOnlyList<TreatmentView> Tratamientos,
    string? IdTratamiento,
    CarePlanView? Plan);

public enum SaveResultStatus
{
    Guardado,
    PacienteNoExiste,
    DatoInvalido,
    SinDiagnostico
}
