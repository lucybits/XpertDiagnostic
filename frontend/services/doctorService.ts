import { getJson } from '@/lib/apiClient';
import type { SessionProfile } from '@/types/doctor';

/** Estado de la sesión: distingue "no hay sesión" (hay que volver al login) de "no se pudo consultar". */
export type SessionState =
  | { status: 'ok'; profile: SessionProfile }
  | { status: 'unauthenticated' }
  | { status: 'error' };

/**
 * Consulta la sesión actual.
 *
 * @post Nunca lanza. 'unauthenticated' si el servidor respondió 401 o 404 (sin cookie, token vencido,
 *       cuenta desactivada o borrada); 'error' si falló la red o el servidor.
 */
export async function getSessionState(): Promise<SessionState> {
  try {
    const response = await getJson<SessionProfile>('/api/session');
    if (response.ok && response.data) return { status: 'ok', profile: response.data };
    return response.status === 401 || response.status === 404 ? { status: 'unauthenticated' } : { status: 'error' };
  } catch {
    return { status: 'error' };
  }
}

/**
 * Perfil del usuario con sesión iniciada.
 *
 * @post Nunca lanza: devuelve el perfil, o null si no hay sesión, falló la red o el servidor.
 */
export async function getSessionProfile(): Promise<SessionProfile | null> {
  const state = await getSessionState();
  return state.status === 'ok' ? state.profile : null;
}

/**
 * Cierra la sesión: el servidor borra la cookie con el token (P-115).
 * @post Nunca lanza: true si el servidor confirmó; false si falló la red (la cookie podría seguir).
 */
export async function logout(): Promise<boolean> {
  try {
    const response = await fetch('/api/session', { method: 'DELETE' });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Cierra la sesión y vuelve al login con una carga completa de la página (P-117).
 * No se usa router.replace: con cacheComponents, Next conserva el estado de /login (formulario en
 * "éxito" con su redirección pendiente) y de las pantallas visitadas; recargar los descarta.
 */
export async function logoutAndGoToLogin(): Promise<void> {
  await logout();
  window.location.replace('/login');
}

