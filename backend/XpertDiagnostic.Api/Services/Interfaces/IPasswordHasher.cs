namespace XpertDiagnostic.Api.Services.Interfaces;

/// <summary>Cifra contraseñas nuevas sin exponer el algoritmo a quien lo usa.</summary>
public interface IPasswordHasher
{
    /// <remarks>
    /// @pre password no está vacía y mide como máximo 72 caracteres.
    /// @post Devuelve un hash distinto de password, apto para USUARIOS.PASS (60 caracteres).
    /// </remarks>
    string Hash(string password);
}
