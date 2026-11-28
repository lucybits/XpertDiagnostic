using Microsoft.EntityFrameworkCore;

namespace XpertDiagnostic.Api.Data;

/// <summary>
/// Patrón Singleton (GoF, creacional) para la conexión a SQL Server. Ver
/// specs/planes/01-arquitectura-y-patrones.md §4.1.
/// </summary>
/// <remarks>
/// Problema: toda la API consulta la misma base de datos. Si cada solicitud leyera la cadena de conexión y
/// armara su propia configuración de Entity Framework, se repetiría el mismo trabajo en cada consulta y
/// podría haber partes del sistema conectadas a bases distintas.
///
/// Solución: esta clase tiene una sola instancia en todo el proceso.
/// - El constructor es privado: nadie puede crearla con <c>new</c>.
/// - <see cref="Inicializar"/> la crea una sola vez al arrancar (<c>Program.cs</c>) con la cadena de
///   conexión de la configuración segura; las llamadas siguientes devuelven la misma instancia.
/// - <see cref="Instancia"/> es el único punto de acceso global.
/// - La configuración de Entity Framework (<see cref="Opciones"/>) se arma una vez y la comparten todos
///   los contextos. <see cref="CrearContexto"/> da un <see cref="AppDbContext"/> nuevo por solicitud,
///   porque un contexto no puede usarse desde dos solicitudes a la vez; las conexiones físicas las
///   reutiliza el pool de conexiones de SQL Server.
///
/// La creación está protegida con un candado (<c>lock</c>): si dos hilos piden la instancia al mismo
/// tiempo, solo uno la crea.
///
/// @inv Existe como máximo una instancia por proceso, y siempre con la misma cadena de conexión.
/// @inv La cadena de conexión no sale de esta clase (no se expone ni se escribe en el código).
/// </remarks>
public sealed class DatabaseConnection
{
    private static readonly object Candado = new();
    private static DatabaseConnection? _instancia;

    private readonly string _cadenaConexion;

    private DatabaseConnection(string cadenaConexion)
    {
        _cadenaConexion = cadenaConexion;
        Opciones = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlServer(cadenaConexion)
            .Options;
    }

    /// <summary>Configuración de Entity Framework compartida por todos los contextos.</summary>
    public DbContextOptions<AppDbContext> Opciones { get; }

    /// <summary>La única instancia. Falla si todavía no se llamó a <see cref="Inicializar"/>.</summary>
    /// <remarks>@pre <see cref="Inicializar"/> ya se llamó (lo hace <c>Program.cs</c> al arrancar).</remarks>
    public static DatabaseConnection Instancia
    {
        get
        {
            lock (Candado)
            {
                return _instancia ?? throw new InvalidOperationException(
                    "La conexión a la base de datos no está inicializada. Llama a DatabaseConnection.Inicializar al arrancar.");
            }
        }
    }

    /// <summary>Crea la instancia la primera vez; después devuelve siempre la misma.</summary>
    /// <remarks>
    /// @pre cadenaConexion no está vacía.
    /// @post Devuelve la única instancia del proceso.
    /// @post Si ya existía con otra cadena de conexión, lanza <see cref="InvalidOperationException"/> y no
    ///       la cambia.
    /// </remarks>
    public static DatabaseConnection Inicializar(string cadenaConexion)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(cadenaConexion);

        lock (Candado)
        {
            if (_instancia is null)
                _instancia = new DatabaseConnection(cadenaConexion);
            else if (!string.Equals(_instancia._cadenaConexion, cadenaConexion, StringComparison.Ordinal))
                throw new InvalidOperationException("La conexión a la base de datos ya se inicializó con otra cadena de conexión.");

            return _instancia;
        }
    }

    /// <summary>Contexto nuevo para una solicitud, con la configuración compartida.</summary>
    /// <remarks>@post Cada llamada devuelve un contexto distinto; quien lo pide se encarga de liberarlo.</remarks>
    public AppDbContext CrearContexto() => new(Opciones);
}
