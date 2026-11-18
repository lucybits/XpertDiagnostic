using System.Security.Cryptography;
using System.Text;
using XpertDiagnostic.Api.Models.Results;
using XpertDiagnostic.Api.Services.Interfaces;

namespace XpertDiagnostic.Api.Services;

/// <summary>
/// Verifica contraseñas con BCrypt. También acepta contraseñas heredadas guardadas en
/// texto plano y, si son correctas, devuelve su hash BCrypt para reemplazarlas.
/// </summary>
public sealed class PasswordCredentialVerifier : IPasswordCredentialVerifier
{
    private const string PrefijoBCrypt = "$2";

    // Hash de un valor aleatorio: sirve para gastar el mismo tiempo cuando el usuario no existe.
    private static readonly string HashFicticio =
        BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString("N"));

    public PasswordVerificationResult Verificar(string password, string? valorGuardado)
    {
        ArgumentNullException.ThrowIfNull(password);

        if (valorGuardado is null)
        {
            BCrypt.Net.BCrypt.Verify(password, HashFicticio);
            return PasswordVerificationResult.Invalida;
        }

        if (valorGuardado.StartsWith(PrefijoBCrypt, StringComparison.Ordinal))
            return VerificarHash(password, valorGuardado);

        return VerificarTextoPlanoHeredado(password, valorGuardado);
    }

    private static PasswordVerificationResult VerificarHash(string password, string hash)
    {
        try
        {
            return BCrypt.Net.BCrypt.Verify(password, hash)
                ? PasswordVerificationResult.Valida
                : PasswordVerificationResult.Invalida;
        }
        catch (BCrypt.Net.SaltParseException)
        {
            return PasswordVerificationResult.Invalida;
        }
    }

    private static PasswordVerificationResult VerificarTextoPlanoHeredado(string password, string guardada)
    {
        var coincide = CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(password),
            Encoding.UTF8.GetBytes(guardada));

        return coincide
            ? PasswordVerificationResult.ValidaConNuevoHash(BCrypt.Net.BCrypt.HashPassword(password))
            : PasswordVerificationResult.Invalida;
    }
}
