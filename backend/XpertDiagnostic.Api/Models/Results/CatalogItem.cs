namespace XpertDiagnostic.Api.Models.Results;

/// <summary>Catálogos de la base de conocimiento que el médico puede consultar al capturar.</summary>
public enum CatalogType
{
    Sintomas,
    Signos,
    EstudiosLaboratorio,
    Comorbilidades,
    Enfermedades
}

/// <summary>
/// Un elemento de catálogo (síntoma, signo, estudio, comorbilidad o enfermedad).
/// Clase con propiedades (no record) porque EF Core la llena desde una consulta SQL.
/// </summary>
/// <remarks>
/// @inv Id y Descripcion no están vacíos.
/// @inv IdEnfermedad es la enfermedad a la que pertenece; null en el catálogo de enfermedades.
/// @inv Unidades y límites solo existen en síntomas, signos y estudios con valor medible.
/// </remarks>
public sealed class CatalogItem
{
    public string Id { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public string? IdEnfermedad { get; set; }
    public string? Unidades { get; set; }
    public decimal? LimiteInferior { get; set; }
    public decimal? LimiteSuperior { get; set; }
}
