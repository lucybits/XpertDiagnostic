'use client';

import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';

type CollapsibleProps = {
  id: string;
  open: boolean;
  children: ReactNode;
  className?: string;
};

const OPEN_DURATION_MS = 360;
const CLOSE_DURATION_MS = 260;
// Arranque rápido y frenado largo: se siente fluido sin rebotar.
const EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';

/**
 * Contenedor que se despliega y se pliega animando su altura real.
 *
 * Optimización:
 * - La animación la ejecuta el navegador (Web Animations API), no React: no hay re-renderizados
 *   por fotograma.
 * - Se mide la altura exacta una sola vez por apertura o cierre y se anima entre dos valores
 *   en píxeles. La animación anterior animaba `grid-template-rows`, que era más costosa.
 * - El efecto visual principal (la cascada de elementos) lo hace quien usa el componente, con
 *   transform y opacity, que el navegador procesa en la GPU.
 * - Si se interrumpe a la mitad (doble clic), continúa desde la altura actual, sin saltos.
 * - Con "reducir movimiento" activado, el cambio es inmediato.
 *
 * Cerrado, el contenido queda `inert`: sin foco y fuera del lector de pantalla.
 */
export default function Collapsible({ id, open, children, className = '' }: CollapsibleProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isFirstRun = useRef(true);
  const [initialOpen] = useState(open);

  useLayoutEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finalHeight = open ? 'auto' : '0px';

    if (prefersReducedMotion) {
      element.style.height = finalHeight;
      return;
    }

    const startHeight = element.getBoundingClientRect().height;
    element.style.height = 'auto';
    const endHeight = open ? element.scrollHeight : 0;
    element.style.height = `${endHeight}px`;

    const animation = element.animate(
      [{ height: `${startHeight}px` }, { height: `${endHeight}px` }],
      { duration: open ? OPEN_DURATION_MS : CLOSE_DURATION_MS, easing: EASING },
    );
    animation.onfinish = () => {
      element.style.height = finalHeight;
    };

    return () => {
      // Si se interrumpe, se conserva la altura de ese instante para continuar desde ahí.
      if (animation.playState === 'running') {
        element.style.height = `${element.getBoundingClientRect().height}px`;
      }
      animation.cancel();
    };
  }, [open]);

  return (
    <div
      ref={containerRef}
      id={id}
      inert={!open}
      data-open={open}
      className={`overflow-hidden ${className}`}
      style={initialOpen ? undefined : { height: 0 }}
    >
      {children}
    </div>
  );
}
