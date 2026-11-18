using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using XpertDiagnostic.Api.Configuration;
using XpertDiagnostic.Api.Models.DTOs;
using XpertDiagnostic.Api.Models.Results;
using XpertDiagnostic.Api.Services.Interfaces;

namespace XpertDiagnostic.Api.Controllers;

/// <summary>
/// Catálogos de la base de conocimiento para la captura estructurada (P-102): síntomas, signos,
/// estudios de laboratorio, comorbilidades y enfermedades. Solo lectura; exige token.
/// </summary>
[ApiController]
[Route("api/catalogs")]
[Produces("application/json")]
[Authorize(Roles = UserRoles.Medico)]
public class CatalogsController(ICatalogService catalogos) : ControllerBase
{
    /// <summary>Elementos de un catálogo.</summary>
    /// <remarks>
    /// @pre nombre es sintomas, signos, estudios-laboratorio, comorbilidades o enfermedades.
    /// @post 200 con los elementos ordenados por descripción; 404 si el catálogo no existe.
    /// </remarks>
    [HttpGet("{nombre}")]
    [ProducesResponseType<IReadOnlyList<CatalogItem>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IReadOnlyList<CatalogItem>>> List(string nombre, CancellationToken cancellationToken)
    {
        if (!catalogos.TryParse(nombre, out var tipo))
            return NotFound(new ErrorResponse("No existe ese catálogo."));

        return Ok(await catalogos.ListarAsync(tipo, cancellationToken));
    }
}
