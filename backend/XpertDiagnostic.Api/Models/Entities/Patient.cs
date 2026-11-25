using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace XpertDiagnostic.Api.Models.Entities;

/// <summary>
/// Paciente de la tabla <c>PACIENTES</c>. Es una tabla de entrada y salida (ESP-004, P-102):
/// el administrador da de alta al paciente (nombre(s), apellidos y fecha de nacimiento, P-150), el
/// médico tratante captura sus hallazgos y la máquina de inferencia llena la enfermedad diagnosticada,
/// el tratamiento y el plan.
/// </summary>
/// <remarks>
/// @inv Id tiene el formato PACIE + 5 dígitos (VARCHAR(10)).
/// @inv NombreCompleto de 3 a 150 caracteres: Nombres + ApellidoPaterno + ApellidoMaterno.
/// @inv Nombres, ApellidoPaterno y ApellidoMaterno pueden ser null solo en pacientes anteriores a P-150.
/// @inv FechaNacimiento no es anterior a 1890-01-01 (CK_PACIENTES_FECHA_NACIMIENTO). La edad se calcula.
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

    [StringLength(60)]
    public string? Nombres { get; set; }

    [StringLength(40)]
    public string? ApellidoPaterno { get; set; }

    [StringLength(40)]
    public string? ApellidoMaterno { get; set; }

    public DateOnly FechaNacimiento { get; set; }

    /// <summary>"F" o "M", en mayúscula y nunca vacío (CK_PACIENTES_SEXO).</summary>
    [Required, StringLength(1, MinimumLength = 1)]
    [Column(TypeName = "char(1)")]
    public string Sexo { get; set; } = string.Empty;

    /// <summary>Hipótesis diagnóstica inicial que escribe el médico tratante (P-151).</summary>
    [StringLength(1000)]
    public string? HipotesisInicial { get; set; }

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

    // ── Validación del diagnóstico por el médico internista (P-151) ──
    /// <summary>"P" pendiente, "C" confirmado o null si aún no se envía (<see cref="XpertDiagnostic.Api.Configuration.ValidationStates"/>).</summary>
    [StringLength(1)]
    [Column(TypeName = "char(1)")]
    public string? EstadoValidacion { get; set; }

    /// <summary>Médico tratante que envió el diagnóstico diferencial a validación.</summary>
    [Column("Id_MedicoSolicitante")]
    public int? IdMedicoSolicitante { get; set; }

    /// <summary>Cuándo se envió (UTC).</summary>
    public DateTime? FechaSolicitud { get; set; }

    /// <summary>Médico internista que confirmó el diagnóstico.</summary>
    [Column("Id_MedicoValidador")]
    public int? IdMedicoValidador { get; set; }

    /// <summary>Cuándo se confirmó (UTC).</summary>
    public DateTime? FechaValidacion { get; set; }
}
