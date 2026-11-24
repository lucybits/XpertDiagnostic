using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace XpertDiagnostic.Api.Models.Entities;

/// <summary>
/// Paciente de la tabla <c>PACIENTES</c>. Es una tabla de entrada y salida (ESP-004, P-102):
/// el médico captura el paciente (nombre, sexo y fecha de nacimiento) y sus hallazgos; la máquina de inferencia llena
/// la enfermedad diagnosticada, el tratamiento y el plan.
/// </summary>
/// <remarks>
/// @inv Id tiene el formato PACIE + 5 dígitos (VARCHAR(10)).
/// @inv NombreCompleto de 3 a 150 caracteres.
/// @inv Edad la calcula SQL Server: años cumplidos de FechaNacimiento a la fecha actual (columna calculada).
/// @inv Sexo es exactamente "F" o "M", en mayúscula y nunca vacío (CK_PACIENTES_SEXO).
/// </remarks>
[Table("PACIENTES")]
public class Patient
{
    [Key, DatabaseGenerated(DatabaseGeneratedOption.None)]
    [Column("Id_Paciente", TypeName = "varchar(10)")]
    public string Id { get; set; } = string.Empty;

    [StringLength(150)]
    public string NombreCompleto { get; set; } = string.Empty;

    public DateOnly FechaNacimiento { get; set; }

    /// <summary>Columna calculada en la base; EF Core no la escribe, solo la lee.</summary>
    [DatabaseGenerated(DatabaseGeneratedOption.Computed)]
    public int Edad { get; set; }

    [Column(TypeName = "char(1)")]
    [Required, StringLength(1, MinimumLength = 1)]
    public string Sexo { get; set; } = string.Empty;

    // ── Salida de la máquina de inferencia (null hasta que exista un diagnóstico) ──
    [Column("Id_EnfermedadDiagnosticada", TypeName = "varchar(10)")]
    public string? IdEnfermedadDiagnosticada { get; set; }

    // ── Entrada que se captura en el chat ──
    [Column("Id_Comorbilidad", TypeName = "varchar(20)")]
    public string? IdComorbilidad { get; set; }

    // ── Salida de la máquina de inferencia ──
    [Column("Id_Tratamiento", TypeName = "varchar(20)")]
    public string? IdTratamiento { get; set; }

    [Column("Id_Plan", TypeName = "varchar(10)")]
    public string? IdPlan { get; set; }
}
