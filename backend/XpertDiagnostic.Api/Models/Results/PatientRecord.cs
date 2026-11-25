namespace XpertDiagnostic.Api.Models.Results;

/// <summary>Un hallazgo del paciente con la descripción de su catálogo, para mostrarlo.</summary>
public sealed record FindingView(string TipoHallazgo, string IdRegistro, string Descripcion, string Valor, string? Unidades);

/// <summary>Respuestas sí/no de antecedentes no patológicos (IO_AntecNoPatolPacientes), P-145.</summary>
public sealed record NonPathologicalHistoryView(
    bool Tabaquismo,
    bool Alcoholismo,
    bool Toxicomanias,
    bool Biomasa,
    bool TatuajesPerforaciones,
    bool Herbolaria,
    bool Transfusiones);

/// <summary>Lo que el tratante captura del paciente fuera de HALLAZGOS_PACIENTE (P-145).</summary>
/// <remarks>@inv Antecedentes es null si todavía no se capturan.</remarks>
public sealed record PatientCaptureState(
    string? HipotesisInicial,
    string? EstadoValidacion,
    NonPathologicalHistoryView? Antecedentes);

/// <summary>
/// Expediente capturado de un paciente: entradas de la máquina de inferencia (P-103), antecedentes no
/// patológicos, hipótesis inicial y estado de validación del diagnóstico (P-145).
/// </summary>
/// <remarks>
/// @inv Hallazgos sin repetir descripción dentro de un mismo tipo (se agrupan los IDs equivalentes).
/// @inv EstadoValidacion es null, "Pendiente" o "Validado".
/// </remarks>
public sealed record PatientRecord(
    string IdPaciente,
    IReadOnlyList<FindingView> Hallazgos,
    NonPathologicalHistoryView? AntecedentesNoPatologicos = null,
    string? HipotesisInicial = null,
    string? EstadoValidacion = null);

public enum SaveFindingsStatus
{
    Guardado,
    PacienteNoExiste,
    RegistroInvalido
}