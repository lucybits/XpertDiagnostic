import type { SessionProfile } from '@/types/doctor';

/** Datos del médico que inició sesión, como se muestran en la barra superior. */
export interface DoctorProfile {
  /** Nombre como está registrado en MEDICOS, por ejemplo "Ana López". */
  displayName: string;
  specialty: string;
}

/**
 * Indicadores de posición mientras se consulta la sesión, o si no se pudo consultar.
 */
export const MOCK_DOCTOR: DoctorProfile = {
  displayName: '{nombre}',
  specialty: '{especialidad}',
};

/** Convierte el perfil de /api/session al formato de la barra superior. */
export function toDoctorProfile(session: SessionProfile): DoctorProfile {
  return {
    displayName: session.nombreCompleto,
    specialty: session.especialidad,
  };
}

/**
 * Iniciales para el avatar: "Dra. Ana López" → "AL" (ignora el título).
 * @post Devuelve una cadena vacía si el nombre no tiene palabras que empiecen con letra
 *       (por ejemplo, el indicador "{nombre}"); en ese caso el avatar muestra un ícono.
 */
export function getInitials(displayName: string): string {
  return displayName
    .split(/\s+/)
    .filter((word) => /^\p{L}/u.test(word) && !word.endsWith('.'))
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');
}
