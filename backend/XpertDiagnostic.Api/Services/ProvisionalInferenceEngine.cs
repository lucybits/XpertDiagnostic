using XpertDiagnostic.Api.Models.Results;
using XpertDiagnostic.Api.Repositories;
using XpertDiagnostic.Api.Services.Interfaces;

namespace XpertDiagnostic.Api.Services;

/// <summary>
/// Implementación provisional de <see cref="IInferenceEngine"/> (P-103), solo para conectar el flujo
/// completo mientras el equipo construye la máquina de inferencia.
/// Regla: cada IdRegistro empieza con el ID de su enfermedad (los 10 primeros caracteres, según
/// CreateClinicalTables.sql). Para cada enfermedad cuenta cuántos hallazgos del paciente le
/// pertenecen y los divide entre sus criterios (síntomas, signos, estudios y comorbilidades).
/// </summary>
/// <remarks>@inv La dependencia no es null durante toda la vida del objeto.</remarks>
public sealed class ProvisionalInferenceEngine(ICatalogRepository catalogos) : IInferenceEngine
{
    private const int LargoIdEnfermedad = 10;
    private const int MaximoCandidatos = 3;

    private static readonly CatalogType[] CatalogosDeCriterios =
        [CatalogType.Sintomas, CatalogType.Signos, CatalogType.EstudiosLaboratorio, CatalogType.Comorbilidades];

    private readonly ICatalogRepository _catalogos = catalogos ?? throw new ArgumentNullException(nameof(catalogos));

    public string Nombre => "Coincidencias por enfermedad (provisional)";

    public bool Provisional => true;

    public async Task<IReadOnlyList<DiagnosisCandidate>> InferirAsync(
        IReadOnlyList<FindingView> hallazgos,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(hallazgos);
        if (hallazgos.Count == 0) return [];

        // Criterios de cada enfermedad: cuántos elementos tiene en los cuatro catálogos.
        var criterios = new Dictionary<string, int>(StringComparer.Ordinal);
        foreach (var catalogo in CatalogosDeCriterios)
        {
            foreach (var elemento in await _catalogos.ListarAsync(catalogo, cancellationToken))
            {
                if (elemento.IdEnfermedad is null) continue;
                criterios[elemento.IdEnfermedad] = criterios.GetValueOrDefault(elemento.IdEnfermedad) + 1;
            }
        }

        var nombres = (await _catalogos.ListarAsync(CatalogType.Enfermedades, cancellationToken))
            .ToDictionary(e => e.Id, e => e.Descripcion, StringComparer.Ordinal);

        return hallazgos
            .Where(h => h.IdRegistro.Length >= LargoIdEnfermedad)
            .GroupBy(h => h.IdRegistro[..LargoIdEnfermedad], StringComparer.Ordinal)
            .Where(g => nombres.ContainsKey(g.Key) && criterios.GetValueOrDefault(g.Key) > 0)
            .Select(g =>
            {
                var total = criterios[g.Key];
                var coincidencias = Math.Min(g.Count(), total);
                return new DiagnosisCandidate(
                    g.Key,
                    nombres[g.Key],
                    coincidencias,
                    total,
                    Math.Round((double)coincidencias / total, 3),
                    [.. g.Select(h => h.Descripcion).Distinct()]);
            })
            .OrderByDescending(c => c.Puntaje)
            .ThenByDescending(c => c.Coincidencias)
            .Take(MaximoCandidatos)
            .ToList();
    }
}
