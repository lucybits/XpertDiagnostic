import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, clearSessionCookie } from '@/lib/backendSession';
import { readSessionToken } from '@/lib/sessionToken';
import { HOME_ROUTE_BY_ROLE } from '@/types/auth';

/**
 * Protección de rutas (P-116, P-140). Next.js 16 llama "proxy" a lo que antes era middleware.
 *
 * - Sin sesión (sin cookie, token mal formado o vencido) → /login.
 * - Cada rol solo abre sus pantallas: /admin el administrador (A), /home y /patients el médico
 *   tratante (T), /internista el médico internista (I). Si el rol no corresponde, se envía a la
 *   pantalla de inicio de su rol (HOME_ROUTE_BY_ROLE).
 *
 * Es una comprobación optimista (lee el token sin verificar la firma, ver lib/sessionToken.ts):
 * el backend vuelve a validar firma, rol y cuenta activa en cada petición de datos.
 */

const ROUTE_ROLES: ReadonlyArray<{ prefix: string; roles: readonly string[] }> = [
  { prefix: '/admin', roles: ['A'] },
  { prefix: '/home', roles: ['T'] },
  { prefix: '/patients', roles: ['T'] },
  { prefix: '/internista', roles: ['I'] },
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const route = ROUTE_ROLES.find(({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  if (!route) return NextResponse.next();

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = readSessionToken(token);

  if (!session) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    // Un token vencido o dañado ya no sirve: se borra para no arrastrarlo.
    return token ? clearSessionCookie(response) : response;
  }

  if (!route.roles.includes(session.rol)) {
    const home = HOME_ROUTE_BY_ROLE[session.rol];
    return NextResponse.redirect(new URL(home ?? '/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/home/:path*', '/patients/:path*', '/internista/:path*'],
};
