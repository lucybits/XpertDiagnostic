import type { NextRequest } from 'next/server';
import { errorResponse, forwardWithSession, parseDoctorId, readJsonObject } from '@/lib/backendSession';
import { validateNewPassword } from '@/lib/doctorValidation';

/**
 * Asigna una contraseña nueva a la cuenta de un médico (ESP-007). El backend la cifra con BCrypt.
 * @pre El cuerpo es JSON con { password } (8 a 72 caracteres).
 * @post 400 si no cumple las reglas (sin llamar al backend); 204/401/403/404/5xx del backend.
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = parseDoctorId((await params).id);
  if (id === null) return errorResponse(404, 'No se encontró al médico.');

  const body = await readJsonObject(request);
  const password = typeof body?.password === 'string' ? body.password : '';
  if (!validateNewPassword(password, password).ok) return errorResponse(400, 'Datos inválidos');

  return forwardWithSession(request, `/api/admin/doctors/${id}/password`, { method: 'PUT', body: { password } });
}
