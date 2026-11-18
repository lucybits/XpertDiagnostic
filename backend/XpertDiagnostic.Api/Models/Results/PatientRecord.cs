namespace XpertDiagnostic.Api.Models.Results;

/// <summary>Un hallazgo del paciente con la descripción de su catálogo, para mostrarlo.</summary>
public sealed record FindingView(string TipoHallazgo, string IdRegistro, string Descripcion, string Valor, string? Unidades);

/// <summary>
/// Expediente capturado de un paciente: entradas de la máquina de inferencia (P-103).
/// </summary>
/// <remarks>@inv Hallazgos sin repetir descripción dentro de un mismo tipo (se agrupan los IDs equivalentes).</remarks>
public sealed record PatientRecord(
    string IdPaciente,
    string? IdEnfermedadPreexistente,
    string? EnfermedadPreexistente,
    IReadOnlyList<FindingView> Hallazgos);

public enum SaveFindingsStatus
{
    Guardado,
    PacienteNoExiste,
    RegistroInvalido
}
