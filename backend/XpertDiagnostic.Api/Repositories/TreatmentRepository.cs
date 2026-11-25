using Microsoft.EntityFrameworkCore;
using XpertDiagnostic.Api.Data;

namespace XpertDiagnostic.Api.Repositories;

/// <summary>Implementación de <see cref="ITreatmentRepository"/> con Entity Framework Core.</summary>
public sealed class TreatmentRepository(AppDbContext db) : ITreatmentRepository
{
    public async Task<IReadOnlyDictionary<string, string>> ObtenerPrimerTratamientoAsync(
        IReadOnlyCollection<string> idsEnfermedad,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(idsEnfermedad);
        if (idsEnfermedad.Count == 0) return new Dictionary<string, string>();

        var filas = await db.Tratamientos.AsNoTracking()
            .Where(t => idsEnfermedad.Contains(t.IdEnfermedad))
            .Select(t => new { t.Id, t.IdEnfermedad, t.Descripcion })
            .ToListAsync(cancellationToken);

        // El de menor ID por enfermedad (los ID tienen ancho fijo: el orden de texto es el numérico).
        return filas
            .GroupBy(t => t.IdEnfermedad, StringComparer.Ordinal)
            .ToDictionary(g => g.Key, g => g.OrderBy(t => t.Id, StringComparer.Ordinal).First().Descripcion, StringComparer.Ordinal);
    }
}
