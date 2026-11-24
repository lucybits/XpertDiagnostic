namespace XpertDiagnostic.Api.Configuration;

/// <summary>Valores de la columna USUARIOS.ROL.</summary>
public static class UserRoles
{
    public const string MedicoTratante = "T";
    public const string MedicoInternista = "I";
    public const string Administrador = "A";
    public const string RolesMedicos = MedicoTratante + "," + MedicoInternista;

    public static bool EsMedico(string? rol) => rol is MedicoTratante or MedicoInternista;
}
