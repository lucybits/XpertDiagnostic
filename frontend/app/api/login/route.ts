import { NextResponse } from 'next/server';
import { BACKEND_URL, SESSION_COOKIE, errorResponse } from '@/lib/backendSession';
import {
  LOGIN_LIMITS,
  ROLE_BY_LOGIN_MODE,
  type BackendLoginResponse,
  type LoginMode,
  type LoginSession,
} from '@/types/auth';

type LoginBody = { usuarioId: number; password: string; rememberMe: boolean; modo: LoginMode };

/**
 * @post true solo si body tiene un usuarioId entero válido, una contraseña de 1 a 72 caracteres
 *       y el apartado del login ('medico' o 'administrador').
 */
function isLoginBody(body: unknown): body is LoginBody {
  if (typeof body !== 'object' || body === null) return false;
  const { usuarioId, password, rememberMe, modo } = body as Record<string, unknown>;

  return (
    typeof usuarioId === 'number' &&
    Number.isSafeInteger(usuarioId) &&
    usuarioId >= 1 &&
    usuarioId <= LOGIN_LIMITS.maxUsuarioId &&
    typeof password === 'string' &&
    password.length >= 1 &&
    password.length <= LOGIN_LIMITS.maxPasswordLength &&
    (rememberMe === undefined || typeof rememberMe === 'boolean') &&
    (modo === 'medico' || modo === 'administrador')
  );
}

/**
 * Reenvía el inicio de sesión al backend ASP.NET Core.
 *
 * @pre El cuerpo es JSON con { usuarioId, password, rememberMe?, modo }.
 * @post 200: guarda el token en una cookie httpOnly (inaccesible para JavaScript) y devuelve
 *       solo los datos públicos de la sesión. Con "Recuérdame", la cookie dura hasta que expira
 *       el token; sin él, se borra al cerrar el navegador.
 * @post 400/401/403/5xx: devuelve { error } con el código del backend, o 503 si el backend no responde.
 *       403: la contraseña es correcta pero la cuenta es de otro apartado o está desactivada.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, 'Datos inválidos');
  }

  if (!isLoginBody(body)) {
    return errorResponse(400, 'Datos inválidos');
  }

  let backendResponse: Response;
  try {
    backendResponse = await fetch(new URL('/api/auth/login', BACKEND_URL), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usuarioId: body.usuarioId,
        password: body.password,
        rol: ROLE_BY_LOGIN_MODE[body.modo],
      }),
      cache: 'no-store',
    });
  } catch (error: unknown) {
    console.error('No se pudo contactar al backend:', error);
    return errorResponse(503, 'El servicio no está disponible en este momento. Inténtalo de nuevo.');
  }

  if (!backendResponse.ok) {
    const data = (await backendResponse.json().catch(() => null)) as { error?: string } | null;
    return errorResponse(backendResponse.status, data?.error ?? 'No se pudo iniciar sesión.');
  }

  const data = (await backendResponse.json()) as BackendLoginResponse;
  const session: LoginSession = {
    usuarioId: data.usuarioId,
    rol: data.rol,
    expiraEn: data.expiraEn,
  };

  const response = NextResponse.json(session);
  response.cookies.set(SESSION_COOKIE, data.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    ...(body.rememberMe ? { expires: new Date(data.expiraEn) } : {}),
  });

  return response;
}
