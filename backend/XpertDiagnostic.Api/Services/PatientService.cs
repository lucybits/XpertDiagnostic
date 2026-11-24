using System.Globalization;
using System.Text.RegularExpressions;
using XpertDiagnostic.Api.Models.DTOs;
using XpertDiagnostic.Api.Models.Entities;
using XpertDiagnostic.Api.Models.Results;
using XpertDiagnostic.Api.Repositories;
using XpertDiagnostic.Api.Services.Interfaces;

namespace XpertDiagnostic.Api.Services;

/// <summary>
/// Consulta y alta de pacientes. Depende solo de <see cref="IPatientRepository"/> (D de SOLID),
/// así que se prueba con un doble en memoria.
/// </summary>
/// <remarks>@inv La dependencia no es null durante toda la vida del objeto.</remarks>
public sealed partial class PatientService(IPatientRepository pacientes) : IPatientService
{
    public const string PrefijoId = "PACIE";
    private const int DigitosId = 5;
    private const int LongitudMaximaId = 10;
    // Si dos médicos registran a la vez, uno choca con el ID del otro y vuelve a intentar.
    private const int IntentosMaximos = 3;

    private readonly IPatientRepository _pacientes = pacientes ?? throw new ArgumentNullException(nameof(pacientes));

    public Task<IReadOnlyList<PatientSummary>> ListarAsync(CancellationToken cancellationToken = default) =>
        _pacientes.ListarAsync(cancellationToken);

    public async Task<PatientSummary> RegistrarAsync(CreatePatientRequest solicitud, CancellationToken cancellationToken = default)
    {
        // @pre
        ArgumentNullException.ThrowIfNull(solicitud);
        ArgumentException.ThrowIfNullOrWhiteSpace(solicitud.Nombres);
        ArgumentException.ThrowIfNullOrWhiteSpace(solicitud.ApellidoPaterno);
        if (solicitud.FechaNacimiento is not { } nacimiento)
            throw new ArgumentException("La fecha de nacimiento es obligatoria.", nameof(solicitud));

        var nombres = Limpiar(solicitud.Nombres);
        var paterno = Limpiar(solicitud.ApellidoPaterno);
        var materno = string.IsNullOrWhiteSpace(solicitud.ApellidoMaterno) ? null : Limpiar(solicitud.ApellidoMaterno);
        // El nombre completo se sigue guardando: lo usan el buscador, la interfaz de salida y el PDF.
        var nombreCompleto = string.Join(' ', new[] { nombres, paterno, materno }.Where(parte => parte is not null));

        for (var intento = 0; intento < IntentosMaximos; intento++)
        {
            var id = SiguienteId(await _pacientes.ObtenerUltimoIdAsync(cancellationToken));
            var paciente = new Patient
            {
                Id = id,
                NombreCompleto = nombreCompleto,
                Nombres = nombres,
                ApellidoPaterno = paterno,
                ApellidoMaterno = materno,
                FechaNacimiento = nacimiento
            };

            if (await _pacientes.CrearAsync(paciente, cancellationToken))
                return new PatientSummary(id, nombreCompleto, nacimiento, Diagnostico: null);
        }

        throw new InvalidOperationException("No se pudo asignar un número de expediente libre.");
    }

    public async Task<bool> EliminarAsync(string idPaciente, CancellationToken cancellationToken = default)
    {
        // Un ID vacío o más largo que la columna (varchar(10)) no puede existir: no se consulta la base.
        if (string.IsNullOrWhiteSpace(idPaciente) || idPaciente.Length > LongitudMaximaId)
            return false;

        return await _pacientes.EliminarAsync(idPaciente, cancellationToken);
    }

    /// <summary>Siguiente IdPaciente a partir del mayor existente.</summary>
    /// <remarks>
    /// @pre ultimo es null o tiene el formato PACIE + dígitos (otro formato se trata como null).
    /// @post Devuelve PACIE + 5 dígitos, uno más que ultimo; PACIE00001 si no hay ninguno.
    /// </remarks>
    public static string SiguienteId(string? ultimo)
    {
        var numero = 0;
        if (ultimo is not null && ultimo.StartsWith(PrefijoId, StringComparison.Ordinal))
            int.TryParse(ultimo.AsSpan(PrefijoId.Length), NumberStyles.None, CultureInfo.InvariantCulture, out numero);

        return PrefijoId + (numero + 1).ToString(new string('0', DigitosId), CultureInfo.InvariantCulture);
    }

    /// <summary>Quita espacios en los extremos y deja uno solo entre palabras.</summary>
    private static string Limpiar(string texto) => EspaciosRepetidos().Replace(texto.Trim(), " ");

    [GeneratedRegex(@"\s+")]
    private static partial Regex EspaciosRepetidos();
}
