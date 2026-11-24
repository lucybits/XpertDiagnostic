namespace XpertDiagnostic.Api.Models;

/// <summary>
/// Edad en años cumplidos a partir de la fecha de nacimiento. Es el mismo cálculo que la columna
/// calculada PACIENTES.Edad; aquí se usa para validar el alta y responder sin releer la base.
/// </summary>
public static class EdadPaciente
{
    /// <summary>Edad máxima que acepta el alta de pacientes.</summary>
    public const int Maxima = 130;

    /// <summary>Años cumplidos en <paramref name="hoy"/>.</summary>
    /// <remarks>
    /// @post Negativo si <paramref name="nacimiento"/> es posterior a <paramref name="hoy"/>.
    /// @post Quien nació un 29 de febrero cumple años el 28 de febrero en años no bisiestos.
    /// </remarks>
    public static int Calcular(DateOnly nacimiento, DateOnly hoy)
    {
        var edad = hoy.Year - nacimiento.Year;
        if (hoy < nacimiento.AddYears(edad)) edad--;
        return edad;
    }

    /// <summary>Fecha de hoy según el reloj del servidor.</summary>
    public static DateOnly Hoy(TimeProvider reloj) => DateOnly.FromDateTime(reloj.GetLocalNow().DateTime);
}
