using Microsoft.EntityFrameworkCore;
using XpertDiagnostic.Api.Data;
using XpertDiagnostic.Api.Models.Results;

namespace XpertDiagnostic.Api.Repositories;

/// <summary>
/// Implementación de <see cref="ICatalogRepository"/>. Cada catálogo tiene una consulta fija:
/// el tipo pedido solo elige una de estas constantes, así que nada externo llega al texto SQL.
/// </summary>
public sealed class CatalogRepository(AppDbContext db) : ICatalogRepository
{
    private static readonly IReadOnlyDictionary<CatalogType, string> Consultas = new Dictionary<CatalogType, string>
    {
        [CatalogType.Sintomas] =
            "SELECT Id_Sintoma AS Id, Descripcion, Id_Enfermedad AS IdEnfermedad, Unidades, LimiteInferior, LimiteSuperior FROM dbo.SINTOMAS",
        [CatalogType.Signos] =
            "SELECT Id_Signo AS Id, Descripcion, Id_Enfermedad AS IdEnfermedad, Unidades, LimiteInferior, LimiteSuperior FROM dbo.SIGNOS",
        [CatalogType.EstudiosLaboratorio] =
            "SELECT Id_Estudio AS Id, Descripcion, Id_Enfermedad AS IdEnfermedad, Unidades, LimiteInferior, LimiteSuperior FROM dbo.ESTUDIOS_LABORATORIO",
        [CatalogType.Comorbilidades] =
            "SELECT Id_Comorbilidad AS Id, Descripcion, Id_Enfermedad AS IdEnfermedad, CAST(NULL AS NVARCHAR(30)) AS Unidades, " +
            "CAST(NULL AS DECIMAL(12,2)) AS LimiteInferior, CAST(NULL AS DECIMAL(12,2)) AS LimiteSuperior FROM dbo.COMORBILIDADES",
        [CatalogType.Enfermedades] =
            "SELECT Id_Enfermedad AS Id, Nombre AS Descripcion, CAST(NULL AS VARCHAR(10)) AS IdEnfermedad, " +
            "CAST(NULL AS NVARCHAR(30)) AS Unidades, CAST(NULL AS DECIMAL(12,2)) AS LimiteInferior, " +
            "CAST(NULL AS DECIMAL(12,2)) AS LimiteSuperior FROM dbo.ENFERMEDADES",
    };

    public async Task<IReadOnlyList<CatalogItem>> ListarAsync(CatalogType tipo, CancellationToken cancellationToken = default)
    {
        if (!Consultas.TryGetValue(tipo, out var consulta))
            throw new ArgumentOutOfRangeException(nameof(tipo), tipo, "Catálogo desconocido.");

        // La consulta es una constante de esta clase (no hay datos externos que escapar).
#pragma warning disable EF1002
        return await db.Database
            .SqlQueryRaw<CatalogItem>(consulta)
            .OrderBy(item => item.Descripcion)
            .ToListAsync(cancellationToken);
#pragma warning restore EF1002
    }
}
