'use client';

import type { LucideIcon } from 'lucide-react';

/** Colores de las acciones del panel: fondo intenso con ícono blanco. */
const TONES = {
  edit: 'bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-600',
  password: 'bg-violet-600 hover:bg-violet-700 focus-visible:ring-violet-600',
  deactivate: 'bg-amber-600 hover:bg-amber-700 focus-visible:ring-amber-600',
  activate: 'bg-green-600 hover:bg-green-700 focus-visible:ring-green-600',
  delete: 'bg-red-600 hover:bg-red-700 focus-visible:ring-red-600',
} as const;

export type IconActionTone = keyof typeof TONES;

type IconActionProps = {
  icon: LucideIcon;
  /** Texto corto de la etiqueta que aparece al pasar el cursor o con el teclado ("Editar"). */
  label: string;
  /** Nombre accesible completo ("Editar datos de Ana López"). */
  description: string;
  tone: IconActionTone;
  onClick: () => void;
};

/**
 * Acción de una fila del panel de administración: círculo de color con ícono blanco y una etiqueta
 * arriba al pasar el cursor o al enfocarlo. El círculo es un ícono, por eso sí va redondo; la
 * etiqueta es cuadrada como el resto del sitio.
 */
export default function IconAction({ icon: Icon, label, description, tone, onClick }: IconActionProps) {
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        onClick={onClick}
        aria-label={description}
        className={`flex h-9 w-9 items-center justify-center rounded-full text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${TONES[tone]}`}
      >
        <Icon aria-hidden="true" className="h-4.5 w-4.5" strokeWidth={2.25} />
      </button>
      <span
        aria-hidden="true"
        // Oculta con display:none (no solo transparente) para que no ocupe espacio. Se alinea al borde
        // derecho del círculo y crece hacia la izquierda: así no se sale de la tabla ni se recorta en la
        // última columna, y no aparece la barra de desplazamiento horizontal.
        className="pointer-events-none absolute right-0 bottom-full z-20 mb-1.5 hidden bg-slate-950 px-2.5 py-1 text-sm font-medium whitespace-nowrap text-white group-focus-within:block group-hover:block"
      >
        {label}
      </span>
    </span>
  );
}
