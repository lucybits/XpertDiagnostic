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
 * @pre El cuerpo es JSON con { givenNames, paternalSurname, maternalSurname?, birthDate } (P-144).
 * @post 400 si los datos no cumplen las reglas (sin llamar al backend).
 * @post 201/401/403/5xx: el código y el cuerpo del backend (403 si no es administrador).
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

  const text = (value: unknown) => (typeof value === 'string' ? value : '');
  const result = validateNewPatient({
    givenNames: text(body.givenNames),
    paternalSurname: text(body.paternalSurname),
    maternalSurname: text(body.maternalSurname),
    birthDate: text(body.birthDate),
  });
  if (!result.ok) return errorResponse(400, 'Datos inválidos');

  return forwardWithSession(request, '/api/patients', {
    method: 'POST',
    body: {
      nombres: result.data.givenNames,
      apellidoPaterno: result.data.paternalSurname,
      apellidoMaterno: result.data.maternalSurname,
      fechaNacimiento: result.data.birthDate,
    },
  });
}
