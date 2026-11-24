using XpertDiagnostic.Api.Configuration;
using XpertDiagnostic.Api.Models.DTOs;
using XpertDiagnostic.Api.Models.Entities;
using XpertDiagnostic.Api.Models.Results;
using XpertDiagnostic.Api.Services;
using XpertDiagnostic.Tests.Fakes;

namespace XpertDiagnostic.Tests;

/// <summary>
/// Pruebas del panel de administración de médicos (ESP-007) con dobles en memoria.
/// Cada caso corresponde a un escenario de specs/especificaciones/10-panel-administrador.md.
/// </summary>
public class DoctorAdministrationServiceTests
{
    [Fact]
    public async Task ListarAsync_SinBusqueda_DevuelveSoloMedicosOrdenadosPorNombre() // PT80
    {
        // Given dos médicos y una cuenta de administrador ligada a un registro de MEDICOS
        var repositorio = new RepositorioMedicosFalso()
            .ConMedico(2, "Zoe Ruiz", "2222222")
            .ConMedico(3, "Ana López", "3333333");
        repositorio.Usuarios.Single(u => u.Id == 2).Rol = UserRoles.MedicoInternista;
        repositorio.Medicos.Add(new Doctor { Id = 1, NombreCompleto = "Admin Dev", Especialidad = "X", CedulaProfesional = "1111111" });
        repositorio.Usuarios.Add(new User { Id = 1, PasswordHash = "x", Rol = UserRoles.Administrador, IdMedico = 1 });
        var servicio = CrearServicio(repositorio);

        // When el administrador abre la lista
        var lista = await servicio.ListarAsync(null);

        // Then ve tratantes e internistas por nombre, sin la cuenta de administrador
        Assert.Equal([3, 2], lista.Select(c => c.IdMedico));
    }

    [Fact]
    public async Task ListarAsync_ConBusqueda_FiltraPorNombreIdOCedula() // PT81
    {
        // Given tres médicos
        var repositorio = new RepositorioMedicosFalso()
            .ConMedico(500, "Ana López", "1234567")
            .ConMedico(600, "Luis Pérez", "7654321")
            .ConMedico(700, "Eva Mora", "5555555");
        var servicio = CrearServicio(repositorio);

        // When busca por parte del nombre, por ID y por cédula
        var porNombre = await servicio.ListarAsync("  lópez ");
        var porId = await servicio.ListarAsync("60");
        var porCedula = await servicio.ListarAsync("5555");

        // Then encuentra al médico correspondiente en cada caso
        Assert.Equal(500, Assert.Single(porNombre).IdMedico);
        Assert.Equal(600, Assert.Single(porId).IdMedico);
        Assert.Equal(700, Assert.Single(porCedula).IdMedico);
    }

    [Fact]
    public async Task ActualizarAsync_DatosValidos_GuardaTextoLimpio() // PT82
    {
        // Given un médico registrado
        var repositorio = new RepositorioMedicosFalso().ConMedico(500, "Ana López", "1234567");
        var servicio = CrearServicio(repositorio);

        // When el administrador corrige sus datos con espacios de más
        var resultado = await servicio.ActualizarAsync(500, new UpdateDoctorRequest
        {
            NombreCompleto = "  Ana  López Ruiz ",
            Especialidad = " Medicina   interna",
            CedulaProfesional = " 7777777 ",
            Rol = UserRoles.MedicoTratante
        });

        // Then quedan guardados sin espacios sobrantes
        Assert.Equal(DoctorUpdateStatus.Actualizado, resultado.Estado);
        var medico = Assert.Single(repositorio.Medicos);
        Assert.Equal("Ana López Ruiz", medico.NombreCompleto);
        Assert.Equal("Medicina interna", medico.Especialidad);
        Assert.Equal("7777777", medico.CedulaProfesional);
    }

    [Fact]
    public async Task ActualizarAsync_CedulaDeOtroMedico_NoCambiaNada() // PT83
    {
        // Given dos médicos
        var repositorio = new RepositorioMedicosFalso()
            .ConMedico(500, "Ana López", "1234567")
            .ConMedico(600, "Luis Pérez", "7654321");
        var servicio = CrearServicio(repositorio);

        // When se intenta poner al 500 la cédula del 600
        var resultado = await servicio.ActualizarAsync(500, Solicitud("Ana López", "7654321"));

        // Then se rechaza y el 500 conserva su cédula
        Assert.Equal(DoctorUpdateStatus.CedulaDuplicada, resultado.Estado);
        Assert.Equal("1234567", repositorio.Medicos.First(m => m.Id == 500).CedulaProfesional);
    }

    [Fact]
    public async Task ActualizarAsync_MismaCedulaPropia_SePermite()
    {
        // Given un médico registrado
        var repositorio = new RepositorioMedicosFalso().ConMedico(500, "Ana López", "1234567");
        var servicio = CrearServicio(repositorio);

        // When solo cambia el nombre y conserva su cédula
        var resultado = await servicio.ActualizarAsync(500, Solicitud("Ana María López", "1234567"));

        // Then se guarda (su propia cédula no cuenta como duplicada)
        Assert.Equal(DoctorUpdateStatus.Actualizado, resultado.Estado);
        Assert.Equal("Ana María López", resultado.Cuenta!.NombreCompleto);
    }

    [Fact]
    public async Task ActualizarAsync_MedicoInexistente_DevuelveNoEncontrado()
    {
        var servicio = CrearServicio(new RepositorioMedicosFalso());

        var resultado = await servicio.ActualizarAsync(999, Solicitud("Nadie Aquí", "1234567"));

        Assert.Equal(DoctorUpdateStatus.NoEncontrado, resultado.Estado);
    }

    [Fact]
    public async Task RestablecerPasswordAsync_MedicoExistente_GuardaHashNuevo() // PT84
    {
        // Given un médico registrado
        var repositorio = new RepositorioMedicosFalso().ConMedico(500, "Ana López", "1234567");
        var servicio = CrearServicio(repositorio);

        // When el administrador le asigna una contraseña nueva
        var guardada = await servicio.RestablecerPasswordAsync(500, "NuevaClave2026");

        // Then queda cifrada (nunca en texto plano)
        Assert.True(guardada);
        Assert.Equal("hash:NuevaClave2026", repositorio.Usuarios.Single().PasswordHash);
    }

    [Fact]
    public async Task RestablecerPasswordAsync_CuentaDeAdministrador_NoLaToca() // PT85
    {
        // Given una cuenta de administrador
        var repositorio = new RepositorioMedicosFalso();
        repositorio.Usuarios.Add(new User { Id = 654321, PasswordHash = "hash:admin", Rol = UserRoles.Administrador });
        var servicio = CrearServicio(repositorio);

        // When se intenta restablecer su contraseña desde el panel de médicos
        var guardada = await servicio.RestablecerPasswordAsync(654321, "NuevaClave2026");

        // Then no se modifica
        Assert.False(guardada);
        Assert.Equal("hash:admin", repositorio.Usuarios.Single().PasswordHash);
    }

    [Fact]
    public async Task RestablecerPasswordAsync_ContrasenaCorta_LanzaArgumentException()
    {
        var servicio = CrearServicio(new RepositorioMedicosFalso().ConMedico(500, "Ana López", "1234567"));

        await Assert.ThrowsAnyAsync<ArgumentException>(() => servicio.RestablecerPasswordAsync(500, "corta"));
    }

    [Fact]
    public async Task CambiarEstadoAsync_Desactivar_ConservaLosDatos() // PT86
    {
        // Given un médico activo
        var repositorio = new RepositorioMedicosFalso().ConMedico(500, "Ana López", "1234567");
        var servicio = CrearServicio(repositorio);

        // When el administrador lo desactiva
        var cuenta = await servicio.CambiarEstadoAsync(500, activo: false);

        // Then la cuenta queda inactiva pero el médico y su cuenta siguen guardados
        Assert.NotNull(cuenta);
        Assert.False(cuenta.Activo);
        Assert.Single(repositorio.Medicos);
        Assert.False(Assert.Single(repositorio.Usuarios).Activo);

        // And puede reactivarse
        Assert.True((await servicio.CambiarEstadoAsync(500, activo: true))!.Activo);
    }

    [Fact]
    public async Task CambiarEstadoAsync_MedicoInexistente_DevuelveNull()
    {
        var servicio = CrearServicio(new RepositorioMedicosFalso());

        Assert.Null(await servicio.CambiarEstadoAsync(999, activo: false));
    }

    [Fact]
    public async Task ActualizarAsync_CambiaTipo_GuardaElRolNuevo() // PT96
    {
        // Given un médico tratante
        var repositorio = new RepositorioMedicosFalso().ConMedico(500, "Ana López", "1234567");
        var servicio = CrearServicio(repositorio);

        // When el administrador lo cambia a internista
        var resultado = await servicio.ActualizarAsync(500, Solicitud("Ana López", "1234567", UserRoles.MedicoInternista));

        // Then la cuenta queda con rol I (y SessionValidator cerrará sus sesiones con rol T)
        Assert.Equal(DoctorUpdateStatus.Actualizado, resultado.Estado);
        Assert.Equal(UserRoles.MedicoInternista, resultado.Cuenta!.Rol);
        Assert.Equal(UserRoles.MedicoInternista, Assert.Single(repositorio.Usuarios).Rol);
    }

    [Fact]
    public async Task ActualizarAsync_TipoAdministrador_Rechaza() // PT96
    {
        var repositorio = new RepositorioMedicosFalso().ConMedico(500, "Ana López", "1234567");
        var servicio = CrearServicio(repositorio);

        await Assert.ThrowsAnyAsync<ArgumentException>(
            () => servicio.ActualizarAsync(500, Solicitud("Ana López", "1234567", UserRoles.Administrador)));
        Assert.Equal(UserRoles.MedicoTratante, Assert.Single(repositorio.Usuarios).Rol);
    }

    [Fact]
    public async Task EliminarAsync_MedicoExistente_BorraMedicoYCuenta() // PT97
    {
        // Given dos médicos registrados
        var repositorio = new RepositorioMedicosFalso()
            .ConMedico(500, "Ana López", "1234567")
            .ConMedico(600, "Luis Pérez", "7654321");
        var servicio = CrearServicio(repositorio);

        // When el administrador elimina al primero
        var eliminado = await servicio.EliminarAsync(500);

        // Then se borran su registro y su cuenta, y el otro médico sigue
        Assert.True(eliminado);
        Assert.Equal(600, Assert.Single(repositorio.Medicos).Id);
        Assert.Equal(600, Assert.Single(repositorio.Usuarios).Id);
    }

    [Fact]
    public async Task EliminarAsync_InexistenteOAdministrador_NoBorraNada() // PT97
    {
        // Given un administrador ligado a un registro de MEDICOS
        var repositorio = new RepositorioMedicosFalso();
        repositorio.Medicos.Add(new Doctor { Id = 1, NombreCompleto = "Admin Dev", Especialidad = "X", CedulaProfesional = "1111111" });
        repositorio.Usuarios.Add(new User { Id = 1, PasswordHash = "x", Rol = UserRoles.Administrador, IdMedico = 1 });
        var servicio = CrearServicio(repositorio);

        // When se intenta eliminar un ID que no existe y al administrador
        // Then ninguno se borra
        Assert.False(await servicio.EliminarAsync(999));
        Assert.False(await servicio.EliminarAsync(1));
        Assert.Single(repositorio.Usuarios);
        Assert.Single(repositorio.Medicos);
    }

    private static DoctorAdministrationService CrearServicio(RepositorioMedicosFalso repositorio) =>
        new(repositorio, new HasherFalso());

    private static UpdateDoctorRequest Solicitud(string nombre, string cedula, string rol = UserRoles.MedicoTratante) => new()
    {
        NombreCompleto = nombre,
        Especialidad = "Cardiología",
        CedulaProfesional = cedula,
        Rol = rol
    };
}
