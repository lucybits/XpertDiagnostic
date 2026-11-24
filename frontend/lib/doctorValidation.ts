import {
  DOCTOR_LIMITS,
  isDoctorRole,
  type DoctorRegistration,
  type DoctorRegistrationField,
  type DoctorUpdate,
} from '@/types/doctor';

/** Datos del formulario tal como se escriben (texto), antes de convertirlos. */
export interface DoctorRegistrationInput {
  idMedico: string;
  nombreCompleto: string;
  especialidad: string;
  cedulaProfesional: string;
  password: string;
  confirmPassword: string;
  /** Tipo de médico elegido: 'T' o 'I'; vacío si aún no se elige. */
  rol: string;
}

export type DoctorUpdateInput = Pick<DoctorRegistrationInput, 'nombreCompleto' | 'especialidad' | 'cedulaProfesional' | 'rol'>;

export type DoctorFieldErrors = Partial<Record<DoctorRegistrationField, string>>;

export type PasswordFieldErrors = Partial<Record<'password' | 'confirmPassword', string>>;

const CEDULA_PATTERN = /^\d{7,8}$/;
const DIGITS_PATTERN = /^\d+$/;

/**
 * Valida el alta de un médico con las mismas reglas que el backend (CreateDoctorRequest).
 *
 * @post ok == true  → data cumple DOCTOR_LIMITS, con nombre y especialidad sin espacios en los extremos.
 * @post ok == false → errors tiene un mensaje por cada campo inválido, en el orden del formulario.
 */
export function validateDoctorRegistration(
  input: DoctorRegistrationInput,
): { ok: true; data: DoctorRegistration } | { ok: false; errors: DoctorFieldErrors } {
  const id = DIGITS_PATTERN.test(input.idMedico) ? Number(input.idMedico) : Number.NaN;
  const errors: DoctorFieldErrors = {};

  if (!Number.isSafeInteger(id) || id < 1 || id > DOCTOR_LIMITS.maxId) {
    errors.idMedico = 'Escribe un ID numérico mayor que 0.';
  }
  const details = validateDoctorUpdate(input);
  if (!details.ok) Object.assign(errors, details.errors);
  const password = validateNewPassword(input.password, input.confirmPassword);
  if (!password.ok) Object.assign(errors, password.errors);

  if (!details.ok || !password.ok || errors.idMedico) return { ok: false, errors };

  return { ok: true, data: { idMedico: id, ...details.data, password: input.password } };
}

/**
 * Valida los datos editables de un médico (UpdateDoctorRequest del backend).
 *
 * @post ok == true → nombre, especialidad y cédula sin espacios en los extremos y dentro de DOCTOR_LIMITS;
 *       rol es 'T' (tratante) o 'I' (internista).
 */
export function validateDoctorUpdate(
  input: DoctorUpdateInput,
): { ok: true; data: DoctorUpdate } | { ok: false; errors: DoctorFieldErrors } {
  const errors: DoctorFieldErrors = {};
  const nombre = input.nombreCompleto.trim().replace(/\s+/g, ' ');
  const especialidad = input.especialidad.trim().replace(/\s+/g, ' ');
  const cedula = input.cedulaProfesional.trim();

  if (nombre.length < DOCTOR_LIMITS.nameMin || nombre.length > DOCTOR_LIMITS.nameMax) {
    errors.nombreCompleto = `Escribe el nombre completo (${DOCTOR_LIMITS.nameMin} a ${DOCTOR_LIMITS.nameMax} caracteres).`;
  }
  if (especialidad.length < DOCTOR_LIMITS.specialtyMin || especialidad.length > DOCTOR_LIMITS.specialtyMax) {
    errors.especialidad = `Escribe la especialidad (${DOCTOR_LIMITS.specialtyMin} a ${DOCTOR_LIMITS.specialtyMax} caracteres).`;
  }
  if (!CEDULA_PATTERN.test(cedula)) {
    errors.cedulaProfesional = 'La cédula profesional debe tener 7 u 8 dígitos.';
  }
  const rol = input.rol;
  if (!isDoctorRole(rol)) {
    errors.rol = 'Elige el tipo de médico: tratante o internista.';
  }

  if (Object.keys(errors).length > 0 || !isDoctorRole(rol)) return { ok: false, errors };
  return { ok: true, data: { nombreCompleto: nombre, especialidad, cedulaProfesional: cedula, rol } };
}

/**
 * Valida una contraseña nueva y su confirmación (8 a 72 caracteres, no solo espacios).
 * @post ok == true → password cumple las reglas y confirmPassword es idéntica.
 */
export function validateNewPassword(
  password: string,
  confirmPassword: string,
): { ok: true } | { ok: false; errors: PasswordFieldErrors } {
  const errors: PasswordFieldErrors = {};

  if (password.length < DOCTOR_LIMITS.passwordMin || password.length > DOCTOR_LIMITS.passwordMax) {
    errors.password = `La contraseña debe tener entre ${DOCTOR_LIMITS.passwordMin} y ${DOCTOR_LIMITS.passwordMax} caracteres.`;
  } else if (password.trim() === '') {
    errors.password = 'La contraseña no puede ser solo espacios.';
  }
  if (confirmPassword !== password) {
    errors.confirmPassword = 'Las contraseñas no coinciden.';
  }

  return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true };
}
