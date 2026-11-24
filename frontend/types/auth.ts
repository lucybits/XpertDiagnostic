/** Modelo del inicio de sesión compartido por la vista, el servicio y la ruta /api/login. */

export type LoginMode = 'medico' | 'administrador';

/** Rol (USUARIOS.ROL) que acepta cada apartado del login: cada apartado solo deja entrar a su rol (P-116). */
export const ROLE_BY_LOGIN_MODE = { medico: 'T', administrador: 'A' } as const satisfies Record<LoginMode, string>;

/**
 * Pantalla de inicio de cada rol después de iniciar sesión. Cada rol tiene su propia pantalla:
 * T (tratante) la captura clínica, I (internista) su espacio propio y A (administrador) el panel.
 * proxy.ts usa este mismo mapa para devolver a cada quien a su pantalla.
 */
export const HOME_ROUTE_BY_ROLE: Readonly<Record<string, string>> = { T: '/home', I: '/internista', A: '/admin' };

export type LoginField = 'usuarioId' | 'password';

/**
 * Datos que el formulario envía a /api/login.
 * @inv usuarioId es un entero entre 1 y 2147483647.
 * @inv password tiene entre 1 y 72 caracteres.
 * @inv modo es el apartado elegido en el login; el backend rechaza cuentas de otro rol.
 */
export interface LoginCredentials {
  usuarioId: number;
  password: string;
  rememberMe: boolean;
  modo: LoginMode;
}

/** Datos públicos de la sesión. El token no se expone al navegador: viaja en una cookie httpOnly. */
export interface LoginSession {
  usuarioId: number;
  rol: string;
  expiraEn: string;
}

/** Respuesta del backend ASP.NET Core en POST /api/auth/login (solo se usa del lado del servidor). */
export interface BackendLoginResponse extends LoginSession {
  token: string;
}

export type LoginFailureReason =
  | 'invalid-credentials'
  /** Contraseña correcta, pero la cuenta es de otro apartado o está desactivada (403, con mensaje del servidor). */
  | 'forbidden'
  | 'invalid-request'
  | 'unavailable'
  | 'network';

export type LoginResult =
  | { ok: true; session: LoginSession }
  | { ok: false; reason: LoginFailureReason; message?: string };

export const LOGIN_LIMITS = {
  maxUsuarioId: 2147483647,
  maxUsuarioIdDigits: 10,
  maxPasswordLength: 72,
} as const;
