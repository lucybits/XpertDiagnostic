namespace XpertDiagnostic.Api.Models.Results;

/// <summary>Datos públicos del usuario autenticado y del médico al que pertenece su cuenta.</summary>
public sealed record DoctorProfile(
    int UsuarioId,
    string Rol,
    string NombreCompleto,
    string Especialidad,
    bool BienvenidaVista);
