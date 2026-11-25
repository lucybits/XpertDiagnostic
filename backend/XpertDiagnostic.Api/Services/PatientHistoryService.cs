using XpertDiagnostic.Api.Models.DTOs;
using XpertDiagnostic.Api.Models.Entities;
using XpertDiagnostic.Api.Models.Results;
using XpertDiagnostic.Api.Repositories;
using XpertDiagnostic.Api.Services.Interfaces;

namespace XpertDiagnostic.Api.Services;

/// <summary>
/// Interrogatorio del paciente (P-159). Traduce entre los nombres de las columnas (abreviados, de la base
/// del equipo) y los del formulario, y limpia los textos antes de guardarlos.
/// </summary>
/// <remarks>@inv La dependencia no es null durante toda la vida del objeto.</remarks>
public sealed class PatientHistoryService(IPatientHistoryRepository antecedentes) : IPatientHistoryService
{
    private readonly IPatientHistoryRepository _antecedentes = antecedentes ?? throw new ArgumentNullException(nameof(antecedentes));

    public async Task<PatientHistory?> ObtenerAsync(string idPaciente, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(idPaciente);
        if (!await _antecedentes.ExistePacienteAsync(idPaciente, cancellationToken)) return null;

        var noPatologicos = await _antecedentes.ObtenerNoPatologicosAsync(idPaciente, cancellationToken);
        var patologicos = await _antecedentes.ObtenerPatologicosAsync(idPaciente, cancellationToken);
        return new PatientHistory(
            idPaciente,
            noPatologicos is null ? null : ADatos(noPatologicos),
            patologicos is null ? null : ADatos(patologicos));
    }

    public async Task<bool> GuardarNoPatologicosAsync(
        string idPaciente,
        NonPathologicalHistoryData datos,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(idPaciente);
        ArgumentNullException.ThrowIfNull(datos);
        if (!await _antecedentes.ExistePacienteAsync(idPaciente, cancellationToken)) return false;

        await _antecedentes.GuardarNoPatologicosAsync(new NonPathologicalHistory
        {
            IdPaciente = idPaciente,
            Tabaquismo = datos.Tabaquismo ?? false,
            Alcoholism = datos.Alcoholismo ?? false,
            Toxicomans = datos.Toxicomanias ?? false,
            Biomasa = datos.Biomasa ?? false,
            TatuajPerf = datos.TatuajesPerforaciones ?? false,
            Herbolaria = datos.Herbolaria ?? false,
            Transfusio = datos.Transfusiones ?? false,
        }, cancellationToken);
        return true;
    }

    public async Task<bool> GuardarPatologicosAsync(
        string idPaciente,
        PathologicalHistoryData datos,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(idPaciente);
        ArgumentNullException.ThrowIfNull(datos);
        if (!await _antecedentes.ExistePacienteAsync(idPaciente, cancellationToken)) return false;

        await _antecedentes.GuardarPatologicosAsync(new PathologicalHistory
        {
            IdPaciente = idPaciente,
            Alergias = Limpio(datos.Alergias),
            CroniDegen = Limpio(datos.CroniDegen),
            Endocrinol = Limpio(datos.Endocrinol),
            Pulmonar = Limpio(datos.Pulmonar),
            Cardiologic = Limpio(datos.Cardiologic),
            Dislipidem = Limpio(datos.Dislipidem),
            Dermatolog = Limpio(datos.Dermatolog),
            Neurologic = Limpio(datos.Neurologic),
            Reumatolog = Limpio(datos.Reumatolog),
            Otorrinola = Limpio(datos.Otorrinola),
            Neumologic = Limpio(datos.Neumologic),
            Psiquiatri = Limpio(datos.Psiquiatri),
            Gastrointe = Limpio(datos.Gastrointe),
            Osteomuscu = Limpio(datos.Osteomuscu),
            UroloRenal = Limpio(datos.UroloRenal),
            Oftalmolog = Limpio(datos.Oftalmolog),
            Infectolog = Limpio(datos.Infectolog),
            Hematologi = Limpio(datos.Hematologi),
            Oncologico = Limpio(datos.Oncologico),
            Ginecologi = Limpio(datos.Ginecologi),
            Traumatism = Limpio(datos.Traumatism),
        }, cancellationToken);
        return true;
    }

    /// <summary>Texto sin espacios sobrantes; vacío o solo espacios = null (sin registrar).</summary>
    public static string? Limpio(string? texto) => string.IsNullOrWhiteSpace(texto) ? null : texto.Trim();

    private static NonPathologicalHistoryData ADatos(NonPathologicalHistory a) => new()
    {
        Tabaquismo = a.Tabaquismo,
        Alcoholismo = a.Alcoholism ?? false,
        Toxicomanias = a.Toxicomans ?? false,
        Biomasa = a.Biomasa ?? false,
        TatuajesPerforaciones = a.TatuajPerf ?? false,
        Herbolaria = a.Herbolaria ?? false,
        Transfusiones = a.Transfusio ?? false,
    };

    private static PathologicalHistoryData ADatos(PathologicalHistory a) => new()
    {
        Alergias = a.Alergias,
        CroniDegen = a.CroniDegen,
        Endocrinol = a.Endocrinol,
        Pulmonar = a.Pulmonar,
        Cardiologic = a.Cardiologic,
        Dislipidem = a.Dislipidem,
        Dermatolog = a.Dermatolog,
        Neurologic = a.Neurologic,
        Reumatolog = a.Reumatolog,
        Otorrinola = a.Otorrinola,
        Neumologic = a.Neumologic,
        Psiquiatri = a.Psiquiatri,
        Gastrointe = a.Gastrointe,
        Osteomuscu = a.Osteomuscu,
        UroloRenal = a.UroloRenal,
        Oftalmolog = a.Oftalmolog,
        Infectolog = a.Infectolog,
        Hematologi = a.Hematologi,
        Oncologico = a.Oncologico,
        Ginecologi = a.Ginecologi,
        Traumatism = a.Traumatism,
    };
}
