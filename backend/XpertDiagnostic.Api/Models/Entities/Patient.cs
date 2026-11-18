using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace XpertDiagnostic.Api.Models.Entities;

/// <summary>
/// Paciente de la tabla <c>PACIENTES</c>. Es una tabla de entrada y salida (ESP-004, P-102):
/// el médico captura el paciente (nombre y edad) y sus hallazgos; la máquina de inferencia llena
/// la enfermedad diagnosticada, el tratamiento y el plan.
/// </summary>
/// <remarks>
/// @inv Id tiene el formato PACIE + 5 dígitos (VARCHAR(10)).
/// @inv NombreCompleto de 3 a 150 caracteres; Edad entre 0 y 130 (CK_PACIENTES_EDAD).
/// </remarks>
[Table("PACIENTES")]
public class Patient
{
    [Key, DatabaseGenerated(DatabaseGeneratedOption.None)]
    [Column("IdPaciente", TypeName = "varchar(10)")]
    public string Id { get; set; } = string.Empty;

    [StringLength(150)]
    public string NombreCompleto { get; set; } = string.Empty;

    public int Edad { get; set; }

    // ── Salida de la máquina de inferencia (null hasta que exista un diagnóstico) ──
    [Column(TypeName = "varchar(10)")]
    public string? IdEnfermedadDiagnosticada { get; set; }

    // ── Entradas que se capturan en el chat ──
    [Column(TypeName = "varchar(10)")]
    public string? IdEnfermedadPreexistente { get; set; }

    [Column(TypeName = "varchar(20)")]
    public string? IdComorbilidad { get; set; }

    // ── Salida de la máquina de inferencia ──
    [Column(TypeName = "varchar(20)")]
    public string? IdTratamiento { get; set; }

    [Column(TypeName = "varchar(10)")]
    public string? IdPlan { get; set; }
}
