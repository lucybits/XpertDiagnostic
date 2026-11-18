/**
 * Lectura del token de sesión para decisiones de navegación (proxy).
 *
 * Solo decodifica, NO verifica la firma: la clave vive en el backend y nunca llega al frontend.
 * Sirve para redirigir pronto (comprobación optimista); la autorización real la hace el backend en
 * cada petición: firma, vigencia, rol y cuenta activa (P-116). Un token alterado podría abrir la
 * pantalla, pero no obtendría ningún dato.
 */

export interface SessionClaims {
  usuarioId: number;
  rol: string;
  /** Expiración en milisegundos desde 1970 (UTC). */
  expiresAt: number;
}

// .NET escribe los claims con nombres cortos ("nameid", "role"); se aceptan también los URI largos.
const ID_CLAIMS = ['nameid', 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
const ROLE_CLAIMS = ['role', 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];

/**
 * @post Devuelve los datos del token, o null si no tiene formato JWT, le faltan ID, rol o expiración,
 *       o ya expiró en `now`.
 */
export function readSessionToken(token: string | undefined, now: number = Date.now()): SessionClaims | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  let payload: Record<string, unknown>;
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const parsed: unknown = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(padded), (c) => c.charCodeAt(0))));
    if (typeof parsed !== 'object' || parsed === null) return null;
    payload = parsed as Record<string, unknown>;
  } catch {
    return null;
  }

  const usuarioId = Number(firstString(payload, ID_CLAIMS));
  const rol = firstString(payload, ROLE_CLAIMS);
  const exp = payload.exp;

  if (!Number.isSafeInteger(usuarioId) || usuarioId < 1 || !rol || typeof exp !== 'number') return null;
  const expiresAt = exp * 1000;
  if (expiresAt <= now) return null;

  return { usuarioId, rol, expiresAt };
}

function firstString(payload: Record<string, unknown>, keys: readonly string[]): string | null {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === 'string' && value) return value;
  }
  return null;
}
