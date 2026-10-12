using System.Security.Cryptography;
using System.Text;
using XpertDiagnostic.Api.Models.Entities;

namespace XpertDiagnostic.Api.Services;

public static class PasswordCredentialVerifier
{
    public static bool VerifyAndUpgrade(string password, Usuario usuario)
    {
        if (usuario.PasswordHash.StartsWith("$2", StringComparison.Ordinal))
        {
            try
            {
                return BCrypt.Net.BCrypt.Verify(password, usuario.PasswordHash);
            }
            catch (BCrypt.Net.SaltParseException)
            {
                return false;
            }
        }

        var suppliedPassword = Encoding.UTF8.GetBytes(password);
        var storedPassword = Encoding.UTF8.GetBytes(usuario.PasswordHash);

        if (!CryptographicOperations.FixedTimeEquals(suppliedPassword, storedPassword))
            return false;

        usuario.PasswordHash = BCrypt.Net.BCrypt.HashPassword(password);
        return true;
    }
}
