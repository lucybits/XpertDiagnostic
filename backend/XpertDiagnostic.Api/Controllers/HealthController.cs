using Microsoft.AspNetCore.Mvc;
using XpertDiagnostic.Api.Models.Results;
using XpertDiagnostic.Api.Services.Interfaces;

namespace XpertDiagnostic.Api.Controllers;

/// <summary>Endpoints de diagnóstico del servicio.</summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class HealthController(IDatabaseHealthService salud) : ControllerBase
{
    /// <summary>Indica si la API puede conectarse a SQL Server.</summary>
    /// <remarks>@post 200 si hay conexión; 503 si no la hay.</remarks>
    [HttpGet("db")]
    [ProducesResponseType<DatabaseStatus>(StatusCodes.Status200OK)]
    [ProducesResponseType<DatabaseStatus>(StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> Db(CancellationToken cancellationToken)
    {
        var estado = await salud.ConsultarAsync(cancellationToken);

        return estado.Conectado
            ? Ok(estado)
            : StatusCode(StatusCodes.Status503ServiceUnavailable, estado);
    }
}
