using Microsoft.EntityFrameworkCore;
using XpertDiagnostic.Api.Models.Entities;

namespace XpertDiagnostic.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Usuarios => Set<User>();
    public DbSet<Doctor> Medicos => Set<Doctor>();
    public DbSet<Patient> Pacientes => Set<Patient>();
    public DbSet<Disease> Enfermedades => Set<Disease>();
    public DbSet<PatientFinding> Hallazgos => Set<PatientFinding>();
    public DbSet<Treatment> Tratamientos => Set<Treatment>();
    public DbSet<CarePlan> Planes => Set<CarePlan>();
    public DbSet<NonPathologicalHistory> AntecedentesNoPatologicos => Set<NonPathologicalHistory>();
    public DbSet<PathologicalHistory> AntecedentesPatologicos => Set<PathologicalHistory>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // USUARIOS.IdMEDICO -> MEDICOS.IdMedico. Declararlo hace que EF inserte primero al médico.
        modelBuilder.Entity<User>()
            .HasOne<Doctor>()
            .WithMany()
            .HasForeignKey(u => u.IdMedico)
            .OnDelete(DeleteBehavior.Restrict);

        // La fecha de alta la asigna SQL Server; EF la omite al insertar y la lee de vuelta.
        modelBuilder.Entity<User>()
            .Property(u => u.FechaRegistro)
            .HasColumnType("datetime2(0)")
            .HasDefaultValueSql("SYSUTCDATETIME()")
            .ValueGeneratedOnAdd()
            // SQL Server no guarda la zona: se marca como UTC para que el JSON lleve "Z" y el navegador
            // la convierta bien a la hora local.
            .HasConversion(v => v, v => DateTime.SpecifyKind(v, DateTimeKind.Utc));

        // Fechas de la validación del internista (P-151): se guardan en UTC y se leen marcadas como UTC.
        modelBuilder.Entity<Patient>(paciente =>
        {
            paciente.Property(p => p.FechaSolicitud)
                .HasColumnType("datetime2(0)")
                .HasConversion(v => v, v => v.HasValue ? DateTime.SpecifyKind(v.Value, DateTimeKind.Utc) : v);
            paciente.Property(p => p.FechaValidacion)
                .HasColumnType("datetime2(0)")
                .HasConversion(v => v, v => v.HasValue ? DateTime.SpecifyKind(v.Value, DateTimeKind.Utc) : v);
        });

        // HALLAZGOS_PACIENTE: llave compuesta (PK_HALLAZGOS_PACIENTE).
        modelBuilder.Entity<PatientFinding>().HasKey(h => new { h.IdPaciente, h.IdRegistro });

        // IO_AntecNoPatolPacientes.IdPaciente -> PACIENTES (uno a uno). Declararlo hace que EF inserte
        // primero al paciente cuando se guardan juntos.
        modelBuilder.Entity<NonPathologicalHistory>()
            .HasOne<Patient>()
            .WithOne()
            .HasForeignKey<NonPathologicalHistory>(a => a.IdPaciente)
            .OnDelete(DeleteBehavior.Restrict);

        // IO_AntecPatolPacientes.IdPaciente -> PACIENTES (uno a uno), igual que los no patológicos (P-159).
        modelBuilder.Entity<PathologicalHistory>()
            .HasOne<Patient>()
            .WithOne()
            .HasForeignKey<PathologicalHistory>(a => a.IdPaciente)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
