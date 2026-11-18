using XpertDiagnostic.Api.Models.Results;

namespace XpertDiagnostic.Api.Services.Interfaces;

/// <summary>Compara contraseñas con el valor guardado sin exponer el algoritmo de hash.</summary>
public interface IPasswordCredentialVerifier
{
    /// <summary>Verifica una contraseña.</summary>
    /// <param name="password">Contraseña escrita por el usuario.</param>
    /// <param name="valorGuardado">
    /// Hash BCrypt o contraseña heredada en texto plano. Si es null (el usuario no existe), se hace
    /// una verificación ficticia del mismo costo para que el tiempo de respuesta no revele qué IDs existen.
    /// </param>
    /// <remarks>
    /// @pre password no es null.
    /// @post Si valorGuardado es null, EsValida == false.
    /// @post Si valorGuardado es un hash BCrypt, HashActualizado == null.
    /// @post Si valorGuardado es texto plano y coincide, HashActualizado es un hash BCrypt de 60 caracteres de password.
    /// @post Si no coincide, devuelve <see cref="PasswordVerificationResult.Invalida"/>.
    /// </remarks>
    PasswordVerificationResult Verificar(string password, string? valorGuardado);
}
