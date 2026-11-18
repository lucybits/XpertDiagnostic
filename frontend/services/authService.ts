import { postJson } from '@/lib/apiClient';
import type { LoginCredentials, LoginResult, LoginSession } from '@/types/auth';

/**
 * Inicia sesión a través de la ruta /api/login de Next.js, que reenvía la solicitud al backend.
 * La vista solo conoce esta función; no sabe de URLs, códigos HTTP ni cookies.
 *
 * @pre credentials cumple las invariantes de LoginCredentials (la vista lo valida antes de llamar).
 * @post Nunca lanza: devuelve { ok: true, session } o { ok: false, reason }.
 * @post reason es 'invalid-credentials' si el servidor respondió 401, 'forbidden' (con el mensaje del
 *       servidor) si respondió 403 por apartado incorrecto o cuenta desactivada, 'invalid-request' si respondió 400,
 *       'network' si no hubo conexión y 'unavailable' en cualquier otro caso.
 */
export async function login(credentials: LoginCredentials): Promise<LoginResult> {
  try {
    const response = await postJson<LoginSession & { error?: string }>('/api/login', credentials);

    if (response.ok && response.data) {
      return { ok: true, session: response.data };
    }

    switch (response.status) {
      case 401:
        return { ok: false, reason: 'invalid-credentials' };
      case 403:
        return { ok: false, reason: 'forbidden', message: response.data?.error };
      case 400:
        return { ok: false, reason: 'invalid-request' };
      default:
        return { ok: false, reason: 'unavailable' };
    }
  } catch {
    return { ok: false, reason: 'network' };
  }
}
