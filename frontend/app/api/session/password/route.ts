import type { NextRequest } from 'next/server';
import { errorResponse, forwardWithSession, readJsonObject } from '@/lib/backendSession';
import { validateNewPassword } from '@/lib/doctorValidation';
import { LOGIN_LIMITS } from '@/types/auth';

/**
 * Cambia la contraseña del usuario con sesión (ESP-007). Requiere la contraseña actual.
 * @pre El cuerpo es JSON con { passwordActual, passwordNueva }.
 * @post 400 si no cumplen las reglas (sin llamar al backend); 204/400/401/5xx del backend.
 */
export async function PUT(request: NextRequest) {
  const body = await readJsonObject(request);
  const actual = typeof body?.passwordActual === 'string' ? body.passwordActual : '';
  const nueva = typeof body?.passwordNueva === 'string' ? body.passwordNueva : '';

  if (actual.length < 1 || actual.length > LOGIN_LIMITS.maxPasswordLength || !validateNewPassword(nueva, nueva).ok) {
    return errorResponse(400, 'Datos inválidos');
  }

  return forwardWithSession(request, '/api/auth/password', {
    method: 'PUT',
    body: { passwordActual: actual, passwordNueva: nueva },
  });
}
