namespace XpertDiagnostic.Api.Models.Results;

/// <summary>Paciente tal como lo muestran el buscador y la píldora de la sesión.</summary>
/// <remarks>@inv Diagnostico es el nombre de la enfermedad diagnosticada, o null si aún no tiene.</remarks>
public sealed record PatientSummary(string IdPaciente, string NombreCompleto, int Edad, string? Diagnostico);
