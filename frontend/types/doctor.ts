/** Médicos y cuentas de usuario (ESP-002, ESP-007). */

/** Valores de USUARIOS.ROL. */
export const USER_ROLES = { doctor: 'M', admin: 'A' } as const;
export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

/** Perfil del usuario autenticado, tal como lo devuelve GET /api/session. */
export interface SessionProfile {
  usuarioId: number;
  rol: string;
  nombreCompleto: string;
  especialidad: string;
  /** true si ya completó la bienvenida guiada del asistente (ESP-003). */
  bienvenidaVista: boolean;
}

/**
 * Datos del alta de un médico con su cuenta. La cuenta siempre es de rol médico (P-116).
 * @inv Cumple DOCTOR_LIMITS (lo verifica validateDoctorRegistration).
 */
export interface DoctorRegistration {
  idMedico: number;
  nombreCompleto: string;
  especialidad: string;
  cedulaProfesional: string;
  password: string;
}

/** Datos editables de un médico (el ID no cambia). */
export type DoctorUpdate = Pick<DoctorRegistration, 'nombreCompleto' | 'especialidad' | 'cedulaProfesional'>;

export type DoctorRegistrationField = keyof DoctorRegistration | 'confirmPassword';

export const DOCTOR_LIMITS = {
  maxId: 2147483647,
  maxIdDigits: 10,
  nameMin: 3,
  nameMax: 120,
  specialtyMin: 2,
  specialtyMax: 80,
  passwordMin: 8,
  passwordMax: 72,
} as const;
