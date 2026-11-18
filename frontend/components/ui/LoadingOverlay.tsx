'use client';

import { createPortal } from 'react-dom';
import LoadingDots from './LoadingDots';

type LoadingOverlayProps = {
  /** Texto que anuncia el lector de pantalla mientras se muestra la capa. */
  message: string;
};

/**
 * Capa de carga a pantalla completa: difumina y oscurece todo el contenido y muestra la animación
 * loading-dots al centro.
 * Se monta en document.body para cubrir toda la ventana aunque el componente que la usa esté dentro
 * de un contenedor con transformaciones (que limitarían un elemento `fixed`).
 *
 * @pre Se renderiza solo en el cliente (después de una acción del usuario).
 */
export default function LoadingOverlay({ message }: LoadingOverlayProps) {
  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/20 backdrop-blur-sm transition-opacity duration-300 starting:opacity-0 motion-reduce:transition-none"
    >
      <LoadingDots className="h-24 w-24" label={null} />
      <span className="sr-only">{message}</span>
    </div>,
    document.body,
  );
}
