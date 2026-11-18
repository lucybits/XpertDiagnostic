using XpertDiagnostic.Api.Models.Results;

namespace XpertDiagnostic.Api.Services.Interfaces;

/// <summary>Consulta si la base de datos está disponible.</summary>
public interface IDatabaseHealthService
{
    /// <remarks>
    /// @post Nunca lanza por fallas de conexión: si la base no responde, devuelve Conectado == false.
    /// </remarks>
    Task<DatabaseStatus> ConsultarAsync(CancellationToken cancellationToken = default);
}
