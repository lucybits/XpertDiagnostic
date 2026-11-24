namespace XpertDiagnostic.Api.Models.Results;

/// <summary>Paciente tal como lo muestran el buscador, el panel de administración y la píldora de la sesión.</summary>
/// <remarks>
/// @inv Diagnostico es el nombre de la enfermedad diagnosticada, o null si aún no tiene.
/// @inv Edad se calcula de FechaNacimiento con la fecha de hoy (P-144); no se guarda.
/// </remarks>
public sealed record PatientSummary(string IdPaciente, string NombreCompleto, DateOnly FechaNacimiento, string? Diagnostico)
{
    /// <summary>Años cumplidos hoy.</summary>
    public int Edad => PatientAge.EnAnios(FechaNacimiento, DateOnly.FromDateTime(DateTime.Today));
}

/// <summary>Cálculo de la edad a partir de la fecha de nacimiento.</summary>
public static class PatientAge
{
    /// <summary>Años cumplidos en <paramref name="hoy"/>.</summary>
    /// <remarks>
    /// @post 0 si la fecha es de hoy o posterior; si no, los años completos (el cumpleaños cuenta ese día).
    ///       Quien nació el 29 de febrero cumple el 28 de febrero en los años no bisiestos.
    /// </remarks>
    public static int EnAnios(DateOnly nacimiento, DateOnly hoy)
    {
        if (nacimiento >= hoy) return 0;
        var anios = hoy.Year - nacimiento.Year;
        // Aún no llega su cumpleaños este año.
        if (hoy < nacimiento.AddYears(anios)) anios--;
        return anios;
    }
}
