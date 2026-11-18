using XpertDiagnostic.Api.Models.Results;
using XpertDiagnostic.Api.Repositories;
using XpertDiagnostic.Api.Services.Interfaces;

namespace XpertDiagnostic.Api.Services;

/// <summary>Consulta de catálogos. Depende solo de <see cref="ICatalogRepository"/>.</summary>
/// <remarks>@inv La dependencia no es null durante toda la vida del objeto.</remarks>
public sealed class CatalogService(ICatalogRepository catalogos) : ICatalogService
{
    // Nombres que admite la URL /api/catalogs/{nombre}.
    private static readonly IReadOnlyDictionary<string, CatalogType> Nombres =
        new Dictionary<string, CatalogType>(StringComparer.OrdinalIgnoreCase)
        {
            ["sintomas"] = CatalogType.Sintomas,
            ["signos"] = CatalogType.Signos,
            ["estudios-laboratorio"] = CatalogType.EstudiosLaboratorio,
            ["comorbilidades"] = CatalogType.Comorbilidades,
            ["enfermedades"] = CatalogType.Enfermedades,
        };

    private readonly ICatalogRepository _catalogos = catalogos ?? throw new ArgumentNullException(nameof(catalogos));

    public bool TryParse(string nombre, out CatalogType tipo) => Nombres.TryGetValue(nombre ?? string.Empty, out tipo);

    public Task<IReadOnlyList<CatalogItem>> ListarAsync(CatalogType tipo, CancellationToken cancellationToken = default)
    {
        if (!Enum.IsDefined(tipo))
            throw new ArgumentOutOfRangeException(nameof(tipo), tipo, "Catálogo desconocido.");
        return _catalogos.ListarAsync(tipo, cancellationToken);
    }
}
