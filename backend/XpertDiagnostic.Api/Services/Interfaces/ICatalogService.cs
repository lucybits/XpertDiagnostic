using XpertDiagnostic.Api.Models.Results;

namespace XpertDiagnostic.Api.Services.Interfaces;

/// <summary>Consulta de los catálogos de la base de conocimiento.</summary>
public interface ICatalogService
{
    /// <summary>Convierte el nombre de la URL (p. ej. "estudios-laboratorio") en un catálogo.</summary>
    /// <remarks>@post true y tipo asignado si el nombre es uno de los admitidos; false en otro caso.</remarks>
    bool TryParse(string nombre, out CatalogType tipo);

    /// <summary>Elementos del catálogo, ordenados por descripción.</summary>
    /// <remarks>@post No modifica datos.</remarks>
    Task<IReadOnlyList<CatalogItem>> ListarAsync(CatalogType tipo, CancellationToken cancellationToken = default);
}
