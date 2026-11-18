import type { NextRequest } from 'next/server';
import { forwardWithSession } from '@/lib/backendSession';

/**
 * Marca que el usuario con sesión completó la bienvenida guiada del asistente (ESP-003).
 *
 * @post 204 si se marcó; 401 sin sesión válida; 404 si la cuenta ya no existe.
 */
export async function POST(request: NextRequest) {
  return forwardWithSession(request, '/api/doctors/me/welcome', { method: 'POST' });
}
