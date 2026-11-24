import type { NextRequest } from 'next/server';
import { errorResponse, forwardWithSession } from '@/lib/backendSession';
import { validateNewPatient } from '@/lib/newPatient';

/**
 * Pacientes registrados para el buscador (ESP-004).
 * @post 200 con la lista del backend; 401 sin sesión; 503 si el backend no responde.
 */
export async function GET(request: NextRequest) {
  return forwardWithSession(request, '/api/patients', { method: 'GET' });
}

/**
 * Registra un paciente. Valida en el servidor con las mismas reglas que el formulario y reenvía
 * al backend, que asigna el IdPaciente.
 *
 * @pre El cuerpo es JSON con { fullName, age, history }; history son las casillas sí/no de
 *      antecedentes no patológicos (si falta, todas cuentan como "no").
 * @post 400 si los datos no cumplen las reglas (sin llamar al backend).
 * @post 201/401/5xx: el código y el cuerpo del backend.
 */
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await request.json();
    if (typeof parsed !== 'object' || parsed === null) throw new Error('cuerpo inválido');
    body = parsed as Record<string, unknown>;
  } catch {
    return errorResponse(400, 'Datos inválidos');
  }

  const result = validateNewPatient({
    fullName: typeof body.fullName === 'string' ? body.fullName : '',
    age: typeof body.age === 'number' ? String(body.age) : '',
    history: body.history,
  });
  if (!result.ok) return errorResponse(400, 'Datos inválidos');

  return forwardWithSession(request, '/api/patients', {
    method: 'POST',
    body: { nombreCompleto: result.data.fullName, edad: result.data.age, ...result.data.history },
  });
}
