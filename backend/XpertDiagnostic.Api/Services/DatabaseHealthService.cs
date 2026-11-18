using System.Data.Common;
using XpertDiagnostic.Api.Models.Results;
using XpertDiagnostic.Api.Repositories;
using XpertDiagnostic.Api.Services.Interfaces;

namespace XpertDiagnostic.Api.Services;

/// <summary>Comprueba la conexión con SQL Server a través del repositorio de usuarios.</summary>
public sealed class DatabaseHealthService(
    IUserRepository usuarios,
    ILogger<DatabaseHealthService> logger
) : IDatabaseHealthService
{
    public async Task<DatabaseStatus> ConsultarAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            if (!await usuarios.PuedeConectarAsync(cancellationToken))
                return new DatabaseStatus(false, null);

            return new DatabaseStatus(true, await usuarios.ContarAsync(cancellationToken));
        }
        catch (DbException ex)
        {
            logger.LogError(ex, "Falló la conexión a SQL Server");
            return new DatabaseStatus(false, null);
        }
    }
}
