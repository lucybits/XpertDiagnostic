namespace XpertDiagnostic.Api.Models.Results;

/// <summary>Un tratamiento de la enfermedad diagnosticada (base de conocimiento).</summary>
public sealed record TreatmentView(string IdTratamiento, string Descripcion, decimal? DosisMinima, decimal? DosisMaxima, string? Unidades);

/// <summary>
/// Plan, pronóstico (expectativa) y seguimiento del paciente (P-164).
/// PlanIndicado se arma con los tratamientos de la base de conocimiento; Pronostico y Seguimiento vienen
/// de PLANES si el paciente tiene uno (la base de conocimiento no los trae).
/// </summary>
public sealed record CarePlanView(string? IdPlan, string PlanIndicado, string? Pronostico, string? Seguimiento);

/// <summary>
/// Interfaz de salida del expediente (P-105, solo lectura desde P-164): las entradas capturadas y las
/// salidas calculadas por la máquina de inferencia para el diagnóstico que confirmó el médico internista.
/// </summary>
/// <remarks>
/// @inv Sin confirmación del internista (EstadoValidacion distinto de "C"), IdEnfermedadDiagnosticada,
///      EnfermedadDiagnosticada, IdTratamiento y Plan son null y Tratamientos está vacío.
/// @inv Tratamientos son los de la enfermedad confirmada, por ID; IdTratamiento es el primero (como el .prg).
/// </remarks>
public sealed record PatientResult(
    PatientSummary Paciente,
    PatientRecord Expediente,
    string? IdEnfermedadDiagnosticada,
    string? EnfermedadDiagnosticada,
    IReadOnlyList<TreatmentView> Tratamientos,
    string? IdTratamiento,
    CarePlanView? Plan,
    DateTime? FechaValidacion = null);
