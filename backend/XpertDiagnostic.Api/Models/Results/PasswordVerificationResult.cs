namespace XpertDiagnostic.Api.Models.Results;

/// <summary>
/// Resultado de comparar una contraseña con el valor guardado.
/// </summary>
/// <param name="EsValida">La contraseña coincide.</param>
/// <param name="HashActualizado">
/// Nuevo hash BCrypt cuando el valor guardado era una contraseña heredada en texto plano
/// y hay que reemplazarlo; <c>null</c> si no hay nada que actualizar.
/// </param>
/// <remarks>
/// @inv HashActualizado != null implica EsValida.
/// </remarks>
public sealed record PasswordVerificationResult(bool EsValida, string? HashActualizado)
{
    public static PasswordVerificationResult Invalida { get; } = new(false, null);
    public static PasswordVerificationResult Valida { get; } = new(true, null);
    public static PasswordVerificationResult ValidaConNuevoHash(string hash) => new(true, hash);
}
