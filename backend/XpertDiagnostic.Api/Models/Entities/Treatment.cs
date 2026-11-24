using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace XpertDiagnostic.Api.Models.Entities;

/// <summary>Tratamiento de una enfermedad en la base de conocimiento (tabla <c>TRATAMIENTOS</c>).</summary>
/// <remarks>
/// @inv Id empieza con el IdEnfermedad al que pertenece (p. ej. CARDI00017TRATA00001).
/// @inv DosisMinima &lt;= DosisMaxima cuando ambas existen (CK_TRATAMIENTOS_DOSIS).
/// </remarks>
[Table("TRATAMIENTOS")]
public class Treatment
{
    [Key, DatabaseGenerated(DatabaseGeneratedOption.None)]
    [Column("Id_Tratamiento", TypeName = "varchar(20)")]
    public string Id { get; set; } = string.Empty;

    [Column("Id_Enfermedad", TypeName = "varchar(10)")]
    public string IdEnfermedad { get; set; } = string.Empty;

    [StringLength(300)]
    public string Descripcion { get; set; } = string.Empty;

    [Column(TypeName = "decimal(12,2)")]
    public decimal? DosisMinima { get; set; }

    [Column(TypeName = "decimal(12,2)")]
    public decimal? DosisMaxima { get; set; }

    [StringLength(30)]
    public string? Unidades { get; set; }
}

/// <summary>Plan, pronóstico y seguimiento de un paciente (tabla <c>PLANES</c>).</summary>
/// <remarks>
/// @inv Id con el formato PLAN_ + 5 dígitos.
/// @inv PlanIndicado no está vacío (máx. 1000); Pronostico y Seguimiento hasta 300 caracteres.
/// </remarks>
[Table("PLANES")]
public class CarePlan
{
    [Key, DatabaseGenerated(DatabaseGeneratedOption.None)]
    [Column("Id_Plan", TypeName = "varchar(10)")]
    public string Id { get; set; } = string.Empty;

    [StringLength(1000)]
    public string PlanIndicado { get; set; } = string.Empty;

    [StringLength(300)]
    public string? Pronostico { get; set; }

    [StringLength(300)]
    public string? Seguimiento { get; set; }
}
