using System.Globalization;
using System.Text;
using XpertDiagnostic.Api.Models.Results;
using XpertDiagnostic.Api.Repositories;
using XpertDiagnostic.Api.Services.Interfaces;

namespace XpertDiagnostic.Api.Services;

/// <summary>
/// Máquina de inferencia de XpertDiagnostic: conversión a C# y SQL Server de inference_engine.prg
/// (Ing. Antonio Castañeda de la Lanza, Visual FoxPro), P-160.
/// </summary>
/// <remarks>
/// Algoritmo del .prg, paso por paso:
/// 1. Toma los hallazgos del paciente (en el .prg: io_sintomas e io_signos).
/// 2. Los busca por TEXTO en la base de conocimiento del mismo tipo (bdc_sintomas, bdc_signos) y se queda
///    con los que existen ("SET RELA TO sintomas INTO bdc_sintomas" + filtro de igualdad).
/// 3. De esas coincidencias toma las enfermedades (id_enferme) sin repetir ("INDEX ... UNIQUE").
/// 4. A cada enfermedad le agrega su nombre (bdc_enfermedades) y su primer tratamiento (bdc_tratamientos).
///
/// 5. Resultado (copia literal del .prg, P-161): "INDE ON enfermedad TO paso40 UNIQUE" + "COPY TO" deja
///    TODAS las enfermedades encontradas, una por nombre, en orden alfabético por nombre. No hay ranking ni
///    límite: el .prg no cuenta coincidencias (aunque su comentario lo diga). Coincidencias y puntaje se
///    calculan solo como información para el médico; no cambian el orden.
///
/// Decisiones del equipo sobre lo que el .prg deja abierto (Lucía, P-160 y P-161):
/// - Entradas: todos los hallazgos que captura el tratante (síntomas, signos, estudios de laboratorio y
///   comorbilidades), no solo síntomas y signos.
/// - La comparación de texto ignora mayúsculas, acentos y espacios repetidos: los catálogos del equipo
///   escriben lo mismo de varias formas ("Melena" y "MELENA").
/// - No se ejecuta el ZAP del .prg (borraba los resultados de los pacientes anteriores) ni se escribe en
///   tablas: el resultado lo valida el médico internista (P-151).
/// - Límites de laboratorio: el .prg no los usa; tampoco aquí.
///
/// @inv Las dependencias no son null durante toda la vida del objeto.
/// </remarks>
public sealed class InferenceEngine(ICatalogRepository catalogos, ITreatmentRepository tratamientos) : IInferenceEngine
{
    /// <summary>Tipo de hallazgo (HALLAZGOS_PACIENTE.TipoHallazgo) → catálogo de la base de conocimiento.</summary>
    private static readonly IReadOnlyDictionary<string, CatalogType> CatalogoPorTipo = new Dictionary<string, CatalogType>(StringComparer.Ordinal)
    {
        ["Sintoma"] = CatalogType.Sintomas,
        ["Signo"] = CatalogType.Signos,
        ["Estudio_lab"] = CatalogType.EstudiosLaboratorio,
        ["Comorbilidad"] = CatalogType.Comorbilidades,
    };

    private readonly ICatalogRepository _catalogos = catalogos ?? throw new ArgumentNullException(nameof(catalogos));
    private readonly ITreatmentRepository _tratamientos = tratamientos ?? throw new ArgumentNullException(nameof(tratamientos));

    public string Nombre => "Máquina de inferencia XpertDiagnostic";

    public async Task<IReadOnlyList<DiagnosisCandidate>> InferirAsync(
        IReadOnlyList<FindingView> hallazgos,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(hallazgos);

        // 1. Hallazgos del paciente: uno por (tipo, texto). Un mismo texto puede venir con varios IDs
        //    (uno por enfermedad del catálogo, P-103); para el .prg es un solo síntoma.
        var delPaciente = hallazgos
            .Where(h => CatalogoPorTipo.ContainsKey(h.TipoHallazgo) && !string.IsNullOrWhiteSpace(h.Descripcion))
            .GroupBy(h => (h.TipoHallazgo, Texto: Normalizar(h.Descripcion)))
            .Select(g => (g.Key.TipoHallazgo, g.Key.Texto, Descripcion: g.First().Descripcion.Trim()))
            .ToList();
        if (delPaciente.Count == 0) return [];

        // Base de conocimiento por tipo: texto normalizado → enfermedades que lo tienen como criterio.
        // También los criterios distintos de cada enfermedad, para la proporción cubierta.
        var enfermedadesPorTexto = new Dictionary<(string Tipo, string Texto), HashSet<string>>();
        var criteriosPorEnfermedad = new Dictionary<string, HashSet<(string Tipo, string Texto)>>(StringComparer.Ordinal);
        foreach (var (tipo, catalogo) in CatalogoPorTipo)
        {
            foreach (var item in await _catalogos.ListarAsync(catalogo, cancellationToken))
            {
                if (item.IdEnfermedad is null || string.IsNullOrWhiteSpace(item.Descripcion)) continue;
                var clave = (tipo, Normalizar(item.Descripcion));
                if (!enfermedadesPorTexto.TryGetValue(clave, out var enfermedades))
                    enfermedadesPorTexto[clave] = enfermedades = new HashSet<string>(StringComparer.Ordinal);
                enfermedades.Add(item.IdEnfermedad);
                if (!criteriosPorEnfermedad.TryGetValue(item.IdEnfermedad, out var criterios))
                    criteriosPorEnfermedad[item.IdEnfermedad] = criterios = [];
                criterios.Add(clave);
            }
        }

        // 2 y 3. Cada hallazgo que existe en la base de conocimiento suma a sus enfermedades.
        var apoyosPorEnfermedad = new Dictionary<string, List<string>>(StringComparer.Ordinal);
        foreach (var (tipo, texto, descripcion) in delPaciente)
        {
            if (!enfermedadesPorTexto.TryGetValue((tipo, texto), out var enfermedades)) continue;
            foreach (var idEnfermedad in enfermedades)
            {
                if (!apoyosPorEnfermedad.TryGetValue(idEnfermedad, out var apoyos))
                    apoyosPorEnfermedad[idEnfermedad] = apoyos = [];
                apoyos.Add(descripcion);
            }
        }
        if (apoyosPorEnfermedad.Count == 0) return [];

        // 4. Nombre de cada enfermedad.
        var nombres = (await _catalogos.ListarAsync(CatalogType.Enfermedades, cancellationToken))
            .GroupBy(e => e.Id, StringComparer.Ordinal)
            .ToDictionary(g => g.Key, g => g.First().Descripcion.Trim(), StringComparer.Ordinal);

        // 5. Como "INDE ON enfermedad UNIQUE" + "COPY TO": una enfermedad por nombre (si dos IDs comparten
        //    nombre, queda la de menor ID) y en orden por nombre. FoxPro ordena por código de carácter sobre
        //    los nombres en mayúsculas; aquí, igual (orden ordinal del nombre en mayúsculas).
        var ordenados = apoyosPorEnfermedad
            .Where(par => nombres.ContainsKey(par.Key))
            .Select(par =>
            {
                var total = criteriosPorEnfermedad[par.Key].Count;
                var coincidencias = Math.Min(par.Value.Count, total);
                return (Id: par.Key, Nombre: nombres[par.Key], Coincidencias: coincidencias, Total: total, Apoyos: par.Value);
            })
            .GroupBy(c => c.Nombre.ToUpperInvariant(), StringComparer.Ordinal)
            .Select(g => g.OrderBy(c => c.Id, StringComparer.Ordinal).First())
            .OrderBy(c => c.Nombre.ToUpperInvariant(), StringComparer.Ordinal)
            .ToList();

        // 4. Primer tratamiento de cada enfermedad elegida.
        var primerTratamiento = await _tratamientos.ObtenerPrimerTratamientoAsync([.. ordenados.Select(c => c.Id)], cancellationToken);

        return ordenados
            .Select(c => new DiagnosisCandidate(
                c.Id,
                c.Nombre,
                c.Coincidencias,
                c.Total,
                Math.Round((double)c.Coincidencias / c.Total, 3),
                [.. c.Apoyos.Distinct()],
                primerTratamiento.GetValueOrDefault(c.Id)))
            .ToList();
    }

    /// <summary>Texto para comparar: sin acentos, en mayúsculas y con un solo espacio entre palabras.</summary>
    /// <remarks>@post "  Melena (más de 100 ml) " y "MELENA (MAS DE 100 ML)" dan lo mismo.</remarks>
    public static string Normalizar(string texto)
    {
        ArgumentNullException.ThrowIfNull(texto);
        var descompuesto = texto.Trim().Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder(descompuesto.Length);
        var espacio = false;
        foreach (var c in descompuesto)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(c) == UnicodeCategory.NonSpacingMark) continue;
            if (char.IsWhiteSpace(c))
            {
                if (!espacio) sb.Append(' ');
                espacio = true;
                continue;
            }
            espacio = false;
            sb.Append(char.ToUpperInvariant(c));
        }
        return sb.ToString().Normalize(NormalizationForm.FormC);
    }
}
