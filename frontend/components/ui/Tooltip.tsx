'use client';

import { useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

type TooltipProps = {
  label: string;
  /** Si es false, solo se muestra el contenido, sin etiqueta. */
  enabled: boolean;
  children: ReactNode;
  /** Clases para la envoltura (por ejemplo, para alinearla dentro de un flex). */
  className?: string;
  /** 'dark': negra con texto blanco (por defecto). 'accent': verde cyan con texto negro. */
  tone?: 'dark' | 'accent';
};

const TONES = {
  dark: 'bg-slate-950 text-white',
  accent: 'bg-teal-400 text-black',
} as const;

const ARROW_TONES = {
  dark: 'bg-slate-950',
  accent: 'bg-teal-400',
} as const;

type Position = { top: number; left: number };

const OFFSET_PX = 12;

/**
 * Etiqueta (negra o verde cyan, según tone) que aparece a la derecha del elemento al pasar el cursor
 * o al enfocarlo con el teclado. Se monta en document.body para que no la recorte un
 * contenedor con desplazamiento.
 *
 * Es solo visual (aria-hidden): el elemento envuelto debe tener ya su propio nombre accesible.
 */
export default function Tooltip({ label, enabled, children, className = '', tone = 'dark' }: TooltipProps) {
  const [position, setPosition] = useState<Position | null>(null);

  const show = (target: HTMLElement) => {
    if (!enabled) return;
    const rect = target.getBoundingClientRect();
    setPosition({ top: rect.top + rect.height / 2, left: rect.right + OFFSET_PX });
  };
  const hide = () => setPosition(null);

  return (
    <span
      className={`block ${className}`}
      onMouseEnter={(event) => show(event.currentTarget)}
      onMouseLeave={hide}
      onFocus={(event) => {
        if (event.target instanceof HTMLElement && event.target.matches(':focus-visible')) {
          show(event.currentTarget);
        }
      }}
      onBlur={hide}
      onClick={hide}
    >
      {children}
      {enabled &&
        position &&
        createPortal(
          <span
            aria-hidden="true"
            style={{ top: position.top, left: position.left }}
            className={`pointer-events-none fixed z-50 -translate-y-1/2 w-max max-w-56 text-balance leading-snug rounded-md px-2.5 py-1.5 text-base font-medium transition-opacity ${TONES[tone]} duration-150 starting:opacity-0 motion-reduce:transition-none`}
          >
            <span className={`absolute top-1/2 -left-1 h-2 w-2 -translate-y-1/2 rotate-45 ${ARROW_TONES[tone]}`} />
            {label}
          </span>,
          document.body,
        )}
    </span>
  );
}
