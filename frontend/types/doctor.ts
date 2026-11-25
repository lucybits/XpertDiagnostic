/** Médicos y cuentas de usuario (ESP-002, ESP-007). */

/** Valores de USUARIOS.ROL. */
export const USER_ROLES = { doctor: 'T', internist: 'I', admin: 'A' } as const;
export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

/** Perfil del usuario autenticado, tal como lo devuelve GET /api/session. */
export interface SessionProfile {
  usuarioId: number;
  rol: string;
  nombreCompleto: string;
  especialidad: string;
}

/** Tipo de médico que el administrador elige al darlo de alta o editarlo (P-144). */
export type DoctorRole = typeof USER_ROLES.doctor | typeof USER_ROLES.internist;

/** Opciones del selector de tipo, en el orden en que se muestran. */
export const DOCTOR_ROLE_OPTIONS: readonly { value: DoctorRole; label: string; hint: string }[] = [
  { value: USER_ROLES.doctor, label: 'Tratante', hint: 'Interrogatorio, captura clínica y exploración física.' },
  { value: USER_ROLES.internist, label: 'Internista', hint: 'Valida el diagnóstico y el tratamiento.' },
];

export const isDoctorRole = (value: unknown): value is DoctorRole =>
  value === USER_ROLES.doctor || value === USER_ROLES.internist;

/** Nombre corto del tipo de médico para listas y avisos. */
export const doctorRoleLabel = (rol: string): string =>
  DOCTOR_ROLE_OPTIONS.find((option) => option.value === rol)?.label ?? rol;

/**
 * Datos del alta de un médico con su cuenta. La cuenta siempre es de rol médico (P-116): tratante o
 * internista, según elija el administrador (P-144).
 * @inv Cumple DOCTOR_LIMITS (lo verifica validateDoctorRegistration).
 */
export interface DoctorRegistration {
  idMedico: number;
  nombreCompleto: string;
  especialidad: string;
  cedulaProfesional: string;
  password: string;
  rol: DoctorRole;
}

/** Datos editables de un médico (el ID no cambia). */
export type DoctorUpdate = Pick<DoctorRegistration, 'nombreCompleto' | 'especialidad' | 'cedulaProfesional' | 'rol'>;

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
