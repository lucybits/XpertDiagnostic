namespace XpertDiagnostic.Api.Models.Results;

/// <summary>Una enfermedad candidata del diagnóstico diferencial.</summary>
/// <remarks>
/// @inv 0 &lt; Coincidencias &lt;= TotalCriterios; Puntaje = Coincidencias / TotalCriterios (0 a 1).
/// @inv Apoyos son las descripciones de los hallazgos del paciente que coinciden.
/// @inv TratamientoSugerido es el primer tratamiento de la enfermedad en la base de conocimiento, o null
///      si no tiene (P-160, como inference_engine.prg).
/// </remarks>
public sealed record DiagnosisCandidate(
    string IdEnfermedad,
    string Nombre,
    int Coincidencias,
    int TotalCriterios,
    double Puntaje,
    IReadOnlyList<string> Apoyos,
    string? TratamientoSugerido = null);

/// <summary>Resultado del análisis de un paciente.</summary>
/// <remarks>
/// @inv Candidatos: todas las enfermedades con al menos una coincidencia, una por nombre y en orden
///      alfabético, como inference_engine.prg (P-161). Coincidencias y puntaje son informativos.
/// @inv Motor indica qué implementación lo produjo (la máquina de inferencia, P-160). Nada se guarda en
///      PACIENTES hasta que el internista lo confirme (P-151).
/// </remarks>
public sealed record DiagnosisResult(string Motor, IReadOnlyList<DiagnosisCandidate> Candidatos);
