import { NextResponse, type NextRequest } from 'next/server';

/** Solo para rutas de servidor (app/api/*): reenvía peticiones al backend con el token de la cookie. */

export const BACKEND_URL = process.env.BACKEND_API_URL ?? 'http://localhost:5140';
export const SESSION_COOKIE = 'xd_session';

const MAX_DOCTOR_ID = 2147483647;

export function errorResponse(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}

/** Borra la cookie de sesión en la respuesta (cerrar sesión o sesión que el backend ya no acepta). */
export function clearSessionCookie(response: NextResponse): NextResponse {
  response.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });
  return response;
}

/**
 * Lee el cuerpo como objeto JSON.
 * @post Devuelve el objeto, o null si el cuerpo no es JSON o no es un objeto.
 */
export async function readJsonObject(request: Request): Promise<Record<string, unknown> | null> {
  const parsed: unknown = await request.json().catch(() => null);
  return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
    ? (parsed as Record<string, unknown>)
    : null;
}

/**
 * Convierte el segmento [id] de la URL en un ID de médico.
 * @post Entero entre 1 y 2147483647, o null si el texto no es solo dígitos o está fuera de rango.
 */
export function parseDoctorId(text: string): number | null {
  if (!/^\d{1,10}$/.test(text)) return null;
  const id = Number(text);
  return id >= 1 && id <= MAX_DOCTOR_ID ? id : null;
}

/**
 * Llama al backend con `Authorization: Bearer <token>` tomado de la cookie httpOnly.
 *
 * @post Sin cookie devuelve 401 sin llamar al backend.
 * @post Si el backend no responde devuelve 503.
 * @post Si el backend responde 401 (token vencido, cuenta desactivada o cambiada), además borra la
 *       cookie: así el proxy manda al login en la siguiente navegación (P-116).
 * @post En otro caso devuelve el mismo código del backend y su cuerpo JSON (o { error } genérico).
 */
export async function forwardWithSession(
  request: NextRequest,
  path: string,
  init: { method: 'GET' | 'POST' | 'PUT'; body?: unknown },
): Promise<NextResponse> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return errorResponse(401, 'Tu sesión terminó. Vuelve a iniciar sesión.');

  let backendResponse: Response;
  try {
    backendResponse = await fetch(new URL(path, BACKEND_URL), {
      method: init.method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        ...(init.body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      cache: 'no-store',
    });
  } catch (error: unknown) {
    console.error('No se pudo contactar al backend:', error);
    return errorResponse(503, 'El servicio no está disponible en este momento. Inténtalo de nuevo.');
  }

  if (backendResponse.status === 401) {
    return clearSessionCookie(errorResponse(401, 'Tu sesión terminó. Vuelve a iniciar sesión.'));
  }

  // 204: éxito sin cuerpo (por ejemplo, al marcar la bienvenida).
  if (backendResponse.status === 204) return new NextResponse(null, { status: 204 });

  const data = (await backendResponse.json().catch(() => null)) as unknown;
  if (data !== null) return NextResponse.json(data, { status: backendResponse.status });

  return errorResponse(backendResponse.status, 'No se pudo completar la solicitud.');
}
