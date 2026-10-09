using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using XpertDiagnostic.Api.Data;

namespace XpertDiagnostic.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController(AppDbContext db, ILogger<HealthController> logger) : ControllerBase
{
    [HttpGet("db")]
    public async Task<IActionResult> Db()
    {
        try
        {
            if (!await db.Database.CanConnectAsync())
                return StatusCode(503, new { conectado = false });

            var usuarios = await db.Usuarios.CountAsync();
            return Ok(new { conectado = true, usuarios });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Fallo la conexion a SQL Server");
            return StatusCode(503, new { conectado = false });
        }
    }
}