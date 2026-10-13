import mssql from 'mssql';

const config: mssql.config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_DATABASE,
  options: {
    instanceName: process.env.DB_INSTANCE, // Toma INSTANCIA_1 si lo definiste en .env.local
    encrypt: false, // Requerido para desarrollo local
    trustServerCertificate: true, // Evita errores de certificados autofirmados en local
  },
};

// Variable para reutilizar la conexión y evitar abrir múltiples conexiones
let pool: mssql.ConnectionPool | null = null;

export async function getConnection() {
  if (!pool) {
    pool = await mssql.connect(config);
  }
  return pool;
}