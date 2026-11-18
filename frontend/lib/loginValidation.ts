import { LOGIN_LIMITS, type LoginField } from '@/types/auth';

export type LoginValidationResult =
  | { valid: true; usuarioId: number }
  | { valid: false; invalidFields: LoginField[]; message: string };

/**
 * Valida en el cliente el ID y la contraseña antes de enviarlos (prevención de errores).
 * El servidor vuelve a validar todo: esta comprobación solo mejora la retroalimentación.
 *
 * @pre usuarioIdText y password son cadenas (pueden estar vacías).
 * @post Si valid, usuarioId es un entero entre 1 y 2147483647 y password no está vacía.
 * @post Si no es válido, invalidFields no está vacío y message explica qué corregir.
 */
export function validateLoginInput(usuarioIdText: string, password: string): LoginValidationResult {
  const normalizedId = usuarioIdText.trim();
  const parsedId = Number(normalizedId);
  const invalidId =
    normalizedId.length > 0 &&
    (!/^\d+$/.test(normalizedId) ||
      !Number.isSafeInteger(parsedId) ||
      parsedId < 1 ||
      parsedId > LOGIN_LIMITS.maxUsuarioId);
  const tooLongPassword = password.length > LOGIN_LIMITS.maxPasswordLength;

  const invalidFields: LoginField[] = [];
  if (!normalizedId || invalidId) invalidFields.push('usuarioId');
  if (!password || tooLongPassword) invalidFields.push('password');

  if (invalidFields.length === 0) {
    return { valid: true, usuarioId: parsedId };
  }

  let message: string;
  if (invalidId) {
    message = 'Ingresa un ID numérico válido.';
  } else if (tooLongPassword) {
    message = `La contraseña no puede tener más de ${LOGIN_LIMITS.maxPasswordLength} caracteres.`;
  } else if (invalidFields.length === 2) {
    message = 'Ingresa tu ID y contraseña.';
  } else if (invalidFields[0] === 'usuarioId') {
    message = 'Ingresa tu ID.';
  } else {
    message = 'Ingresa tu contraseña.';
  }

  return { valid: false, invalidFields, message };
}
