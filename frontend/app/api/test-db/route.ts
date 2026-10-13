import { connection, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';

export async function GET() {
  await connection();

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
    console.error('Error de conexión:', error);
    return NextResponse.json(
      {
        estado: 'Error al conectar a la base de datos',
        error:
          error instanceof Error
            ? error.message
            : 'Error desconocido al conectar a la base de datos',
      },
      { status: 500 }
    );
  }
}
