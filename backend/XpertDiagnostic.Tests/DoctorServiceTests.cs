using System.ComponentModel.DataAnnotations;
using XpertDiagnostic.Api.Configuration;
using XpertDiagnostic.Api.Models.DTOs;
using XpertDiagnostic.Api.Models.Entities;
using XpertDiagnostic.Api.Models.Results;
using XpertDiagnostic.Api.Services;
using XpertDiagnostic.Tests.Fakes;

namespace XpertDiagnostic.Tests;

/// <summary>
/// Pruebas del registro de médicos con dobles de prueba en memoria.
/// Cada caso corresponde a un escenario de specs/especificaciones/05-registro-medicos.md.
/// </summary>
public class DoctorServiceTests
{
    [Fact]
    public async Task RegistrarAsync_DatosNuevos_GuardaMedicoYCuentaConHash() // PT17
    {
        // Given un ID y una cédula que no existen
        var repositorio = new RepositorioMedicosFalso();
        var servicio = new DoctorService(repositorio, new HasherFalso());

        // When el administrador registra al médico desde el panel
        var resultado = await servicio.RegistrarAsync(CrearSolicitud());

        // Then se guardan el médico y su usuario activo con el mismo ID, rol T y contraseña cifrada
        Assert.Equal(DoctorRegistrationStatus.Creado, resultado.Estado);
        var medico = Assert.Single(repositorio.Medicos);
        var usuario = Assert.Single(repositorio.Usuarios);
        Assert.Equal(500, medico.Id);
        Assert.Equal(500, usuario.Id);
        Assert.Equal(500, usuario.IdMedico);
        Assert.Equal(UserRoles.MedicoTratante, usuario.Rol);
        Assert.Equal("hash:ClaveSegura1", usuario.PasswordHash);
        Assert.NotEqual("ClaveSegura1", usuario.PasswordHash);
        Assert.True(usuario.Activo);
        Assert.NotNull(resultado.Cuenta);
        Assert.Equal("Ana López", resultado.Cuenta.NombreCompleto);
        Assert.True(resultado.Cuenta.Activo);
    }

    [Fact]
    public async Task RegistrarAsync_IdRepetido_NoGuardaNada() // PT18
    {
        // Given que ya existe un usuario con el ID 500
        var repositorio = new RepositorioMedicosFalso();
        repositorio.Usuarios.Add(new User { Id = 500, PasswordHash = "x", Rol = UserRoles.MedicoTratante, IdMedico = 500 });
        var servicio = new DoctorService(repositorio, new HasherFalso());

        // When se registra otro médico con el ID 500
        var resultado = await servicio.RegistrarAsync(CrearSolicitud());

        // Then el resultado es "ID duplicado" y no se agrega nada
        Assert.Equal(DoctorRegistrationStatus.IdDuplicado, resultado.Estado);
        Assert.Empty(repositorio.Medicos);
        Assert.Single(repositorio.Usuarios);
    }

    [Fact]
    public async Task RegistrarAsync_CedulaRepetida_NoGuardaNada() // PT19
    {
        // Given que ya existe un médico con la cédula 1234567
        var repositorio = new RepositorioMedicosFalso();
        repositorio.Medicos.Add(new Doctor { Id = 1, NombreCompleto = "Otro", Especialidad = "X", CedulaProfesional = "1234567" });
        var servicio = new DoctorService(repositorio, new HasherFalso());

        // When se registra otro médico con esa cédula
        var resultado = await servicio.RegistrarAsync(CrearSolicitud());

        // Then el resultado es "cédula duplicada" y no se agrega nada
        Assert.Equal(DoctorRegistrationStatus.CedulaDuplicada, resultado.Estado);
        Assert.Single(repositorio.Medicos);
        Assert.Empty(repositorio.Usuarios);
    }

    [Fact]
    public async Task RegistrarAsync_EspaciosSobrantes_GuardaTextoLimpio() // PT20
    {
        // Given un nombre y una especialidad con espacios de más
        var repositorio = new RepositorioMedicosFalso();
        var servicio = new DoctorService(repositorio, new HasherFalso());
        var solicitud = CrearSolicitud();
        solicitud.NombreCompleto = "  Ana   López ";
        solicitud.Especialidad = " Medicina  interna ";

        // When se registra
        await servicio.RegistrarAsync(solicitud);

        // Then se guardan sin espacios repetidos ni en los extremos
        var medico = Assert.Single(repositorio.Medicos);
        Assert.Equal("Ana López", medico.NombreCompleto);
        Assert.Equal("Medicina interna", medico.Especialidad);
    }

    [Fact]
    public async Task ObtenerPerfilAsync_UsuarioExistente_DevuelveNombreYEspecialidad() // PT21
    {
        // Given el usuario 1 enlazado al médico 1
        var repositorio = new RepositorioMedicosFalso();
        repositorio.Medicos.Add(new Doctor { Id = 1, NombreCompleto = "Ana López", Especialidad = "Cardiología", CedulaProfesional = "7654321" });
        repositorio.Usuarios.Add(new User { Id = 1, PasswordHash = "x", Rol = UserRoles.Administrador, IdMedico = 1 });
        var servicio = new DoctorService(repositorio, new HasherFalso());

        // When se consulta su perfil
        var perfil = await servicio.ObtenerPerfilAsync(1);

        // Then se devuelven su ID, rol, nombre y especialidad
        Assert.NotNull(perfil);
        Assert.Equal(1, perfil.UsuarioId);
        Assert.Equal(UserRoles.Administrador, perfil.Rol);
        Assert.Equal("Ana López", perfil.NombreCompleto);
        Assert.Equal("Cardiología", perfil.Especialidad);
    }

    [Fact]
    public async Task ObtenerPerfilAsync_UsuarioInexistente_DevuelveNull() // PT22
    {
        var servicio = new DoctorService(new RepositorioMedicosFalso(), new HasherFalso());

        Assert.Null(await servicio.ObtenerPerfilAsync(999));
    }

    [Fact]
    public async Task RegistrarAsync_TipoInternista_CreaCuentaConRolI() // PT95
    {
        // Given un ID y una cédula libres
        var repositorio = new RepositorioMedicosFalso();
        var servicio = new DoctorService(repositorio, new HasherFalso());

        // When el administrador registra al médico eligiendo el tipo Internista
        var resultado = await servicio.RegistrarAsync(CrearSolicitud(UserRoles.MedicoInternista));

        // Then la cuenta queda con rol I y la respuesta lo informa
        Assert.Equal(DoctorRegistrationStatus.Creado, resultado.Estado);
        Assert.Equal(UserRoles.MedicoInternista, Assert.Single(repositorio.Usuarios).Rol);
        Assert.Equal(UserRoles.MedicoInternista, resultado.Cuenta!.Rol);
    }

    [Theory] // PT95
    [InlineData("T", true)]
    [InlineData("I", true)]
    [InlineData("A", false)]
    [InlineData("", false)]
    [InlineData("M", false)]
    public void CreateDoctorRequest_Tipo_SoloAdmiteTratanteOInternista(string rol, bool esValido)
    {
        // Given una solicitud de alta con ese tipo
        var solicitud = CrearSolicitud(rol);

        // When ASP.NET Core la valida
        var valido = Validator.TryValidateObject(solicitud, new ValidationContext(solicitud), [], validateAllProperties: true);

        // Then el panel no puede crear administradores ni roles desconocidos
        Assert.Equal(esValido, valido);
    }

    private static CreateDoctorRequest CrearSolicitud(string rol = UserRoles.MedicoTratante) => new()
    {
        IdMedico = 500,
        NombreCompleto = "Ana López",
        Especialidad = "Cardiología",
        CedulaProfesional = "1234567",
        Password = "ClaveSegura1",
        Rol = rol
    };

    [Fact]
    public async Task ObtenerPerfilAsync_AdministradorSinMedico_DevuelveNombreGenerico() // PT79
    {
        // Given la cuenta de administrador 654321, sin registro en MEDICOS
        var repositorio = new RepositorioMedicosFalso();
        repositorio.Usuarios.Add(new User { Id = 654321, PasswordHash = "x", Rol = UserRoles.Administrador, IdMedico = null });
        var servicio = new DoctorService(repositorio, new HasherFalso());

        // When se consulta su perfil
        var perfil = await servicio.ObtenerPerfilAsync(654321);

        // Then se muestra como "Administrador"
        Assert.NotNull(perfil);
        Assert.Equal(UserRoles.Administrador, perfil.Rol);
        Assert.Equal(DoctorService.NombreAdministrador, perfil.NombreCompleto);
        Assert.Equal(DoctorService.EspecialidadAdministrador, perfil.Especialidad);
    }
}
