import { UserRound } from 'lucide-react';
import type { Patient } from '@/types/patient';

/**
 * Píldora fija con el paciente de la sesión (P-101), arriba a la izquierda del área de conversación.
 * No se desplaza con el chat y sigue visible aunque el encabezado de la sección esté oculto; así
 * siempre se sabe de quién es el expediente que se está capturando. Al bajar en el chat se esconde
 * para no tapar el contenido, y vuelve en cuanto se sube (P-104). Fondo azul marino con texto
 * blanco para que contraste con el chat blanco (P-101).
 */
export default function SessionPatientPill({ patient, hidden }: { patient: Patient; hidden: boolean }) {
  return (
    <p
      title={`${patient.fullName} | ${patient.recordNumber}`}
      // Se esconde al bajar y vuelve al subir (P-104); oculta, no recibe clics ni lectores de pantalla.
      aria-hidden={hidden || undefined}
      className={`absolute top-3 left-4 z-10 flex max-w-[min(30rem,calc(100%-14rem))] min-w-0 items-center gap-2 rounded-full bg-[#0b1533] py-1 pr-4 pl-1 transition-[translate,opacity] duration-300 ease-out starting:opacity-0 motion-reduce:transition-none sm:left-8 ${
        hidden ? 'pointer-events-none -translate-y-[calc(100%+1rem)] opacity-0' : ''
      }`}
    >
      <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-400 text-black">
        <UserRound className="h-4 w-4" />
      </span>
      <span className="sr-only">Paciente de la sesión: </span>
      <span className="truncate font-semibold text-white">{patient.fullName}</span>
      <span aria-hidden="true" className="shrink-0 text-slate-500">
        |
      </span>
      <span className="shrink-0 text-sm text-slate-300 tabular-nums">{patient.recordNumber}</span>
    </p>
  );
}
