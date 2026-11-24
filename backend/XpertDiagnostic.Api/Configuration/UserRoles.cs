namespace XpertDiagnostic.Api.Configuration;

/// <summary>Valores de la columna USUARIOS.ROL.</summary>
/// <remarks>
/// Reparto de tareas (P-144):
/// - Administrador (A): alta y baja de médicos; alta y baja de pacientes.
/// - Médico tratante (T): interrogatorio, captura clínica y exploración física del paciente.
/// - Médico internista (I): valida el diagnóstico y el tratamiento (aplazado).
/// </remarks>
public static class UserRoles
{
    public const string MedicoTratante = "T";
    public const string MedicoInternista = "I";
    public const string Administrador = "A";
    public const string RolesMedicos = MedicoTratante + "," + MedicoInternista;
    /// <summary>Todos los roles: consultar la lista de pacientes.</summary>
    public const string Todos = RolesMedicos + "," + Administrador;

    public static bool EsMedico(string? rol) => rol is MedicoTratante or MedicoInternista;
}
