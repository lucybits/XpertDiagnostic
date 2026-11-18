import mssql from 'mssql';

/**
 * Patrón Singleton (GoF, creacional) para la conexión a SQL Server.
 *
 * Problema: abrir una conexión nueva cada vez que se consulta la base desperdicia recursos
 * y puede agotar las conexiones del servidor.
 *
 * Solución: getConnection() es el único punto de acceso al pool. La primera llamada lo crea
 * y lo guarda en `pool`; las siguientes reciben el mismo pool. Se guarda la *promesa* y no el
 * pool ya conectado, para que varias solicitudes simultáneas durante el primer arranque
 * compartan una sola conexión en lugar de abrir una cada una.
 *
 * La instancia se guarda en globalThis porque, en desarrollo, Next.js vuelve a cargar los
 * módulos al editar código; una variable de módulo se perdería y se abrirían pools nuevos.
 *
 * @inv Existe como máximo un pool de conexiones por proceso de Node.js.
 *
 * Los datos de conexión vienen de variables de entorno (.env.local) y nunca se escriben en el código.
 */

type SqlSingletonStore = typeof globalThis & {
  __xpertDiagnosticSqlPool?: Promise<mssql.ConnectionPool>;
};

const store = globalThis as SqlSingletonStore;

function readEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

/**
 * @pre DB_DATABASE está definida en el entorno.
 * @post Devuelve una configuración sin credenciales escritas en el código.
 */
function buildConfig(): mssql.config {
  const database = readEnv('DB_DATABASE');
  if (!database) {
    throw new Error('Falta la variable de entorno DB_DATABASE. Revisa frontend/.env.local.');
  }

  return {
    server: readEnv('DB_SERVER') ?? 'localhost',
    database,
    user: readEnv('DB_USER'),
    password: readEnv('DB_PASSWORD'),
    options: {
      instanceName: readEnv('DB_INSTANCE'),
      encrypt: readEnv('DB_ENCRYPT') === 'true',
      trustServerCertificate: readEnv('DB_TRUST_SERVER_CERTIFICATE') !== 'false',
    },
  };
}

/**
 * Devuelve la única instancia del pool de conexiones, creándola la primera vez.
 *
 * @pre Las variables DB_* están configuradas.
 * @post Llamadas sucesivas devuelven la misma promesa y, por tanto, el mismo pool.
 * @post Si la conexión falla, la instancia se descarta para que la siguiente llamada lo reintente
 *       (no se queda guardado un pool roto).
 */
export function getConnection(): Promise<mssql.ConnectionPool> {
  if (!store.__xpertDiagnosticSqlPool) {
    const pool = new mssql.ConnectionPool(buildConfig());

    pool.on('error', (error: unknown) => {
      console.error('Error en el pool de SQL Server:', error);
      store.__xpertDiagnosticSqlPool = undefined;
    });

    store.__xpertDiagnosticSqlPool = pool.connect().catch((error: unknown) => {
      store.__xpertDiagnosticSqlPool = undefined;
      throw error;
    });
  }

  return store.__xpertDiagnosticSqlPool;
}
