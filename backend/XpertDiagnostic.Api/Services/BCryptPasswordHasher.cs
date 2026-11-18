using XpertDiagnostic.Api.Services.Interfaces;

namespace XpertDiagnostic.Api.Services;

/// <summary>Cifra contraseñas con BCrypt (hash de 60 caracteres con sal incluida).</summary>
public sealed class BCryptPasswordHasher : IPasswordHasher
{
    public string Hash(string password)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(password);
        return BCrypt.Net.BCrypt.HashPassword(password);
    }
}
