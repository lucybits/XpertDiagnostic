namespace XpertDiagnostic.Api.Models.Results;

/// <summary>Una enfermedad candidata del diagnóstico diferencial.</summary>
/// <remarks>
/// @inv 0 &lt; Coincidencias &lt;= TotalCriterios; Puntaje = Coincidencias / TotalCriterios (0 a 1).
/// @inv Apoyos son las descripciones de los hallazgos del paciente que coinciden.
/// </remarks>
public sealed record DiagnosisCandidate(
    string IdEnfermedad,
    string Nombre,
    int Coincidencias,
    int TotalCriterios,
    double Puntaje,
    IReadOnlyList<string> Apoyos);

/// <summary>Resultado del análisis de un paciente.</summary>
/// <remarks>
/// @inv Candidatos ordenados de mayor a menor puntaje (máx. 3).
/// @inv Motor indica qué implementación lo produjo; Provisional = true mientras no exista la máquina de
///      inferencia del equipo (P-103). Nada se guarda en PACIENTES hasta que el médico lo confirme.
/// </remarks>
public sealed record DiagnosisResult(string Motor, bool Provisional, IReadOnlyList<DiagnosisCandidate> Candidatos);
