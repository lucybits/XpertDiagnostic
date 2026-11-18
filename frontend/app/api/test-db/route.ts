import { connection, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';

/**
 * Prueba de conexión a SQL Server, disponible solo en desarrollo.
 * Usa el Singleton de lib/db.ts: todas las llamadas comparten el mismo pool.
 */
export async function GET() {
  await connection();

  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  }

  try {
    const pool = await getConnection();

    const result = await pool
      .request()
      .query('SELECT @@VERSION AS version, GETDATE() AS fecha');

    return NextResponse.json({
      estado: 'Conexión exitosa a SQL Server',
      datos: result.recordset[0],
    });
  } catch (error: unknown) {
    // El detalle queda en el log del servidor; al cliente no se le envían datos internos.
    console.error('Error de conexión:', error);
    return NextResponse.json(
      { estado: 'Error al conectar a la base de datos' },
      { status: 503 },
    );
  }
}
