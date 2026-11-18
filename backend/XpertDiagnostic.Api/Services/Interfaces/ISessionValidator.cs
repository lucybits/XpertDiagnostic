namespace XpertDiagnostic.Api.Services.Interfaces;

/// <summary>
/// Revisa, en cada petición autenticada, que la cuenta del token siga existiendo, activa y con el
/// mismo rol. Así, desactivar una cuenta o cambiar su rol surte efecto de inmediato y no hasta que
/// expire el token (P-116).
/// </summary>
public interface ISessionValidator
{
    /// <remarks>
    /// @post true solo si usuarioId &gt; 0, la cuenta existe, está activa y su rol es igual a rol.
    /// @post No modifica datos.
    /// </remarks>
    Task<bool> EsVigenteAsync(int usuarioId, string? rol, CancellationToken cancellationToken = default);
}
