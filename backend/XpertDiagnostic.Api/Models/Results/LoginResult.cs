using XpertDiagnostic.Api.Models.DTOs;

namespace XpertDiagnostic.Api.Models.Results;

public enum LoginStatus
{
    Exitoso,
    /// <summary>El ID no existe o la contraseña no coincide (no se distingue cuál, para no revelar IDs).</summary>
    CredencialesInvalidas,
    /// <summary>Credenciales correctas, pero la cuenta es de otro rol que el apartado elegido.</summary>
    ApartadoIncorrecto,
    /// <summary>Credenciales correctas, pero el administrador desactivó la cuenta.</summary>
    CuentaInactiva
}

/// <summary>Resultado de un intento de inicio de sesión.</summary>
/// <remarks>
/// @inv Respuesta != null si y solo si Estado == Exitoso.
/// @inv RolDeLaCuenta != null si y solo si Estado == ApartadoIncorrecto (para indicar el apartado correcto).
/// </remarks>
public sealed record LoginResult(LoginStatus Estado, LoginResponse? Respuesta, string? RolDeLaCuenta = null)
{
    public static LoginResult Exitoso(LoginResponse respuesta) => new(LoginStatus.Exitoso, respuesta);
    public static readonly LoginResult CredencialesInvalidas = new(LoginStatus.CredencialesInvalidas, null);
    public static readonly LoginResult CuentaInactiva = new(LoginStatus.CuentaInactiva, null);
    public static LoginResult ApartadoIncorrecto(string rolDeLaCuenta) => new(LoginStatus.ApartadoIncorrecto, null, rolDeLaCuenta);
}

public enum PasswordChangeStatus
{
    Cambiada,
    PasswordActualIncorrecta,
    CuentaNoEncontrada
}
