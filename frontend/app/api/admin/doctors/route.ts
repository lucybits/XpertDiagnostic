import type { NextRequest } from 'next/server';
import { errorResponse, forwardWithSession, readJsonObject } from '@/lib/backendSession';
import { validateDoctorRegistration } from '@/lib/doctorValidation';

const MAX_QUERY_LENGTH = 120;

/**
 * Médicos registrados con el estado de su cuenta (ESP-007). Solo administradores (lo exige el backend).
 * @post 200 con la lista; 401 sin sesión; 403 si no es administrador; 503 si el backend no responde.
 */
export async function GET(request: NextRequest) {
  const query = (request.nextUrl.searchParams.get('q') ?? '').trim().slice(0, MAX_QUERY_LENGTH);
  const path = query ? `/api/admin/doctors?q=${encodeURIComponent(query)}` : '/api/admin/doctors';
  return forwardWithSession(request, path, { method: 'GET' });
}

/**
 * Registra un médico con su cuenta. Valida con las mismas reglas que el formulario y reenvía.
 *
 * @pre El cuerpo es JSON con { idMedico, nombreCompleto, especialidad, cedulaProfesional, password }.
 * @post 400 si los datos no cumplen las reglas (sin llamar al backend).
 * @post 201/401/403/409/5xx: el código y el cuerpo del backend.
 */
export async function POST(request: NextRequest) {
  const body = await readJsonObject(request);
  if (!body) return errorResponse(400, 'Datos inválidos');

  const text = (value: unknown) => (typeof value === 'string' ? value : '');
  const password = text(body.password);
  const result = validateDoctorRegistration({
    idMedico: typeof body.idMedico === 'number' ? String(body.idMedico) : '',
    nombreCompleto: text(body.nombreCompleto),
    especialidad: text(body.especialidad),
    cedulaProfesional: text(body.cedulaProfesional),
    password,
    confirmPassword: password,
  });
  if (!result.ok) return errorResponse(400, 'Datos inválidos');

  return forwardWithSession(request, '/api/admin/doctors', { method: 'POST', body: result.data });
}
