using Microsoft.EntityFrameworkCore;
using XpertDiagnostic.Api.Data;

namespace XpertDiagnostic.Tests;

/// <summary>
/// Pruebas del Singleton de la conexión a SQL Server (plan 01, §4.1). No se conectan a la base de datos:
/// Entity Framework solo abre la conexión al hacer una consulta.
/// </summary>
/// <remarks>
/// La instancia es estática y dura todo el proceso de pruebas; por eso todas las pruebas usan la misma
/// cadena de conexión y viven en esta clase (xUnit ejecuta en orden las pruebas de una misma clase).
/// </remarks>
public class DatabaseConnectionTests
{
    private const string Cadena = "Server=servidor-de-prueba;Database=XpertDiagnostic;Trusted_Connection=True;TrustServerCertificate=True";

    [Fact]
    public void Inicializar_DosVeces_DevuelveLaMismaInstancia()
    {
        // Given la conexión inicializada al arrancar
        var primera = DatabaseConnection.Inicializar(Cadena);

        // When se inicializa otra vez y se pide la instancia
        var segunda = DatabaseConnection.Inicializar(Cadena);

        // Then siempre es el mismo objeto
        Assert.Same(primera, segunda);
        Assert.Same(primera, DatabaseConnection.Instancia);
    }

    [Fact]
    public void Inicializar_OtraCadena_LanzaYConservaLaOriginal()
    {
        var original = DatabaseConnection.Inicializar(Cadena);

        Assert.Throws<InvalidOperationException>(
            () => DatabaseConnection.Inicializar("Server=otro;Database=Otra;Trusted_Connection=True"));
        Assert.Same(original, DatabaseConnection.Instancia);
    }

    [Fact]
    public void CrearContexto_CadaSolicitud_ContextoNuevoConLaMismaConfiguracion()
    {
        var conexion = DatabaseConnection.Inicializar(Cadena);

        using var contexto1 = conexion.CrearContexto();
        using var contexto2 = conexion.CrearContexto();

        Assert.NotSame(contexto1, contexto2);
        Assert.Equal("Microsoft.EntityFrameworkCore.SqlServer", contexto1.Database.ProviderName);
        Assert.Equal(contexto1.Database.GetConnectionString(), contexto2.Database.GetConnectionString());
    }

    [Fact]
    public void Inicializar_CadenaVacia_LanzaArgumentException()
    {
        Assert.ThrowsAny<ArgumentException>(() => DatabaseConnection.Inicializar(" "));
    }
}
