import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';

export async function GET() {
  try {
    const pool = await getConnection();
    
    // Consulta simple para verificar la versión de SQL Server y la hora actual
    const result = await pool.request().query('SELECT @@VERSION AS version, GETDATE() AS fecha');

    return NextResponse.json({
      estado: 'Conexión exitosa a SQL Server',
      datos: result.recordset[0],
    });
  } catch (error: any) {
    console.error('Error de conexión:', error);
    return NextResponse.json(
      {
        estado: 'Error al conectar a la base de datos',
        error: error.message,
      },
      { status: 500 }
    );
  }
}