using System.Globalization;
using XpertDiagnostic.Api.Models.DTOs;
using XpertDiagnostic.Api.Models.Entities;
using XpertDiagnostic.Api.Models.Results;
using XpertDiagnostic.Api.Repositories;
using XpertDiagnostic.Api.Services.Interfaces;

namespace XpertDiagnostic.Api.Services;

/// <summary>
/// Captura estructurada del expediente (P-103). Los catálogos pertenecen a cada enfermedad, así que
/// una misma descripción ("Disnea") tiene un ID por enfermedad: al elegirla se guardan todos, para
/// que la máquina de inferencia pueda comparar por ID contra cualquier enfermedad.
/// </summary>
/// <remarks>@inv Las dependencias no son null durante toda la vida del objeto.</remarks>
public sealed class PatientRecordService(IPatientRecordRepository expedientes, ICatalogRepository catalogos)
    : IPatientRecordService
{
    // Secciones con hallazgos: nombre en la URL → catálogo y TipoHallazgo de HALLAZGOS_PACIENTE.
    private static readonly IReadOnlyDictionary<string, CatalogType> Secciones =
        new Dictionary<string, CatalogType>(StringComparer.OrdinalIgnoreCase)
        {
            ["sintomas"] = CatalogType.Sintomas,
            ["signos"] = CatalogType.Signos,
            ["estudios-laboratorio"] = CatalogType.EstudiosLaboratorio,
            ["comorbilidades"] = CatalogType.Comorbilidades,
        };

    private static readonly IReadOnlyDictionary<CatalogType, string> TiposHallazgo = new Dictionary<CatalogType, string>
    {
        [CatalogType.Sintomas] = FindingValues.Sintoma,
        [CatalogType.Signos] = FindingValues.Signo,
        [CatalogType.EstudiosLaboratorio] = FindingValues.EstudioLaboratorio,
        [CatalogType.Comorbilidades] = FindingValues.Comorbilidad,
    };

    private readonly IPatientRecordRepository _expedientes = expedientes ?? throw new ArgumentNullException(nameof(expedientes));
    private readonly ICatalogRepository _catalogos = catalogos ?? throw new ArgumentNullException(nameof(catalogos));

    public bool TryParseSeccion(string nombre, out CatalogType catalogo) =>
        Secciones.TryGetValue(nombre ?? string.Empty, out catalogo);

    public async Task<PatientRecord?> ObtenerAsync(string idPaciente, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(idPaciente);
        if (!await _expedientes.ExistePacienteAsync(idPaciente, cancellationToken))
            return null;

        var filas = await _expedientes.ListarHallazgosAsync(idPaciente, cancellationToken);

        // Los IDs equivalentes (misma descripción en el mismo tipo) se muestran una sola vez.
        var hallazgos = filas
            .GroupBy(f => (f.TipoHallazgo, Clave: Normalizar(f.Descripcion)))
            .Select(grupo => grupo.First())
            .ToList();

        return new PatientRecord(idPaciente, hallazgos);
    }

    public async Task<SaveFindingsStatus> GuardarHallazgosAsync(
        string idPaciente,
        CatalogType catalogo,
        IReadOnlyList<FindingInput> hallazgos,
        CancellationToken cancellationToken = default)
    {
        // @pre
        ArgumentException.ThrowIfNullOrWhiteSpace(idPaciente);
        ArgumentNullException.ThrowIfNull(hallazgos);
        if (!TiposHallazgo.TryGetValue(catalogo, out var tipoHallazgo))
            throw new ArgumentOutOfRangeException(nameof(catalogo), catalogo, "La sección no guarda hallazgos.");

        if (!await _expedientes.ExistePacienteAsync(idPaciente, cancellationToken))
            return SaveFindingsStatus.PacienteNoExiste;

        var elementos = await _catalogos.ListarAsync(catalogo, cancellationToken);
        var porId = elementos.ToDictionary(e => e.Id, StringComparer.Ordinal);
        var porDescripcion = elementos.ToLookup(e => Normalizar(e.Descripcion));

        var guardar = new Dictionary<string, PatientFinding>(StringComparer.Ordinal);
        foreach (var entrada in hallazgos)
        {
            if (!porId.TryGetValue(entrada.IdRegistro, out var elegido))
                return SaveFindingsStatus.RegistroInvalido;

            var medido = entrada.Valor is not null;
            foreach (var equivalente in porDescripcion[Normalizar(elegido.Descripcion)])
            {
                guardar[equivalente.Id] = new PatientFinding
                {
                    IdPaciente = idPaciente,
                    TipoHallazgo = tipoHallazgo,
                    IdRegistro = equivalente.Id,
                    Valor = medido ? entrada.Valor! : FindingValues.Presente,
                    Unidades = medido ? equivalente.Unidades : null,
                };
            }
        }

        await _expedientes.ReemplazarHallazgosAsync(idPaciente, tipoHallazgo, [.. guardar.Values], cancellationToken);
        return SaveFindingsStatus.Guardado;
    }

    /// <summary>Descripción comparable: sin espacios en los extremos y en minúsculas.</summary>
    private static string Normalizar(string descripcion) =>
        descripcion.Trim().ToLower(CultureInfo.InvariantCulture);
}