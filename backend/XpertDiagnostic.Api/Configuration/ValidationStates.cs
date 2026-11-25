namespace XpertDiagnostic.Api.Configuration;

/// <summary>Valores de PACIENTES.EstadoValidacion (P-151).</summary>
/// <remarks>
/// Flujo: el médico tratante analiza y envía el diagnóstico diferencial (Pendiente); el médico internista
/// revisa los candidatos y confirma uno (Confirmado), que queda como enfermedad diagnosticada.
/// </remarks>
public static class ValidationStates
{
    /// <summary>El tratante lo envió y espera la confirmación del internista.</summary>
    public const string Pendiente = "P";

    /// <summary>El internista confirmó el diagnóstico.</summary>
    public const string Confirmado = "C";

    public static bool EsValido(string? estado) => estado is Pendiente or Confirmado;

    /// <summary>
    /// Estado que se informa: el guardado, o null si no es válido. Un diagnóstico guardado sin pasar por el
    /// internista (por ejemplo, los pacientes de prueba del seed) NO cuenta como confirmado: el sistema no
    /// debe decir que un internista lo validó si no ocurrió (A-28).
    /// </summary>
    /// <remarks>@post null, Pendiente o Confirmado.</remarks>
    public static string? Efectivo(string? estado) => EsValido(estado) ? estado : null;
}
