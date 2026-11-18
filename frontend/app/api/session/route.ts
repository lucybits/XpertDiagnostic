import { NextResponse, type NextRequest } from 'next/server';
import { clearSessionCookie, forwardWithSession } from '@/lib/backendSession';

/**
 * Perfil del usuario con sesión iniciada (nombre, especialidad y rol).
 *
 * @post 200 con { usuarioId, rol, nombreCompleto, especialidad }; 401 sin sesión válida.
 */
export async function GET(request: NextRequest) {
  return forwardWithSession(request, '/api/doctors/me', { method: 'GET' });
}

/**
 * Cierra la sesión: borra la cookie httpOnly con el token (P-115). El token deja de enviarse al
 * backend; expira por sí solo en el servidor (JWT sin lista de revocación).
 *
 * @post 204 y la cookie de sesión eliminada, haya o no sesión.
 */
export async function DELETE() {
  return clearSessionCookie(new NextResponse(null, { status: 204 }));
}
