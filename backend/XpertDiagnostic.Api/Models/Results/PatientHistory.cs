using XpertDiagnostic.Api.Models.DTOs;

namespace XpertDiagnostic.Api.Models.Results;

/// <summary>Interrogatorio de un paciente (P-159): antecedentes no patológicos y patológicos.</summary>
/// <remarks>@inv Cada parte es null mientras el médico tratante no la haya guardado.</remarks>
public sealed record PatientHistory(
    string IdPaciente,
    NonPathologicalHistoryData? NoPatologicos,
    PathologicalHistoryData? Patologicos);
