using XpertDiagnostic.Api.Models.Results;

namespace XpertDiagnostic.Api.Repositories;

/// <summary>Lectura de los catálogos de la base de conocimiento.</summary>
public interface ICatalogRepository
{
    /// <summary>Elementos del catálogo pedido, ordenados por descripción.</summary>
    /// <remarks>@post No modifica datos.</remarks>
    Task<IReadOnlyList<CatalogItem>> ListarAsync(CatalogType tipo, CancellationToken cancellationToken = default);
}
