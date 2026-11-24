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
 * @pre El cuerpo es JSON con { fullName, birthDate, sex, history }: birthDate "AAAA-MM-DD", sex "F"/"M"
 *      y history las casillas sí/no de antecedentes no patológicos (si falta, todas cuentan como "no").
 *      El backend calcula la edad a partir de birthDate.
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
    birthDate: typeof body.birthDate === 'string' ? body.birthDate : '',
    sex: typeof body.sex === 'string' ? body.sex : '',
    history: body.history,
  });
  if (!result.ok) return errorResponse(400, 'Datos inválidos');

  return forwardWithSession(request, '/api/patients', {
    method: 'POST',
    body: {
      nombreCompleto: result.data.fullName,
      fechaNacimiento: result.data.birthDate,
      sexo: result.data.sex,
      ...result.data.history,
    },
  });
}
