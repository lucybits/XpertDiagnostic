using System.Data.Common;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.EntityFrameworkCore;
using XpertDiagnostic.Api.Models.DTOs;

namespace XpertDiagnostic.Api.Middleware;

/// <summary>
/// Convierte las excepciones no controladas en respuestas HTTP con el formato
/// <see cref="ErrorResponse"/>. Registra el detalle en el log y nunca lo envía al cliente.
/// </summary>
/// <remarks>
/// Así los controladores no repiten bloques try/catch ni dependen del proveedor de base de datos.
/// @post Fallas de base de datos responden 503; cualquier otra excepción responde 500.
/// </remarks>
public sealed class GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        var (status, mensaje) = exception switch
        {
            DbException or DbUpdateException => (
                StatusCodes.Status503ServiceUnavailable,
                "El servicio no está disponible en este momento. Inténtalo de nuevo."),
            _ => (
                StatusCodes.Status500InternalServerError,
                "Error interno del servidor")
        };

        logger.LogError(exception, "Error no controlado en {Metodo} {Ruta}",
            httpContext.Request.Method, httpContext.Request.Path);

        httpContext.Response.StatusCode = status;
        await httpContext.Response.WriteAsJsonAsync(new ErrorResponse(mensaje), cancellationToken);
        return true;
    }
}
