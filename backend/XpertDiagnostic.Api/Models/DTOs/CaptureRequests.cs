using System.ComponentModel.DataAnnotations;

namespace XpertDiagnostic.Api.Models.DTOs;

/// <summary>
/// Antecedentes no patológicos que el médico tratante captura en el interrogatorio (P-145).
/// Cada casilla es sí (true) o no (false); sin enviar cuenta como no.
/// </summary>
public class SaveNonPathologicalHistoryRequest
{
    /// <summary>¿Fuma? → Tabaquismo.</summary>
    public bool Tabaquismo { get; set; }

    /// <summary>¿Consume alcohol? → Alcoholism.</summary>
    public bool Alcoholismo { get; set; }

    /// <summary>¿Consume drogas? → Toxicomans.</summary>
    public bool Toxicomanias { get; set; }

    /// <summary>¿Exposición a humo de leña o biomasa? → Biomasa.</summary>
    public bool Biomasa { get; set; }

    /// <summary>¿Tatuajes o perforaciones? → TatuajPerf.</summary>
    public bool TatuajesPerforaciones { get; set; }

    /// <summary>¿Usa herbolaria? → Herbolaria.</summary>
    public bool Herbolaria { get; set; }

    /// <summary>¿Ha recibido transfusiones? → Transfusio.</summary>
    public bool Transfusiones { get; set; }
}

/// <summary>Hipótesis diagnóstica inicial que escribe el médico tratante antes de analizar (P-145).</summary>
/// <remarks>@inv Hipotesis de 3 a 1000 caracteres, no solo espacios.</remarks>
public class SaveHypothesisRequest
{
    public const int LongitudMaxima = 1000;

    [Required(ErrorMessage = "Escribe la hipótesis inicial.")]
    [StringLength(LongitudMaxima, MinimumLength = 3, ErrorMessage = "La hipótesis debe tener de 3 a 1000 caracteres.")]
    [RegularExpression(@"^[\s\S]*\S[\s\S]*$", ErrorMessage = "La hipótesis no puede estar vacía.")]
    public string Hipotesis { get; set; } = string.Empty;
}
