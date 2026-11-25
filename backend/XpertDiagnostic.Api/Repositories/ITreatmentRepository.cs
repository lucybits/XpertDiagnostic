namespace XpertDiagnostic.Api.Repositories;

/// <summary>Tratamientos de la base de conocimiento (TRATAMIENTOS) que usa la máquina de inferencia (P-160).</summary>
public interface ITreatmentRepository
{
    /// <summary>
    /// Primer tratamiento de cada enfermedad (el de menor ID), como hace inference_engine.prg al relacionar
    /// bdc_tratamientos por enfermedad.
    /// </summary>
    /// <remarks>@post Una entrada por enfermedad que tenga tratamientos: Id_Enfermedad → descripción. No modifica datos.</remarks>
    Task<IReadOnlyDictionary<string, string>> ObtenerPrimerTratamientoAsync(
        IReadOnlyCollection<string> idsEnfermedad,
        CancellationToken cancellationToken = default);
}
