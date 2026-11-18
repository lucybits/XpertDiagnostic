'use client';

import { Lottie } from 'lottie-react';
import loadingDotsAnimation from '../../public/loading-dots.json';

type LoadingDotsProps = {
  /** Tamaño del contenedor (clases de Tailwind). */
  className?: string;
  /** Texto que anuncia el lector de pantalla. Con null, la animación es solo decorativa. */
  label?: string | null;
};

export default function LoadingDots({
  className = 'h-7 w-7',
  label = 'Iniciando sesión',
}: LoadingDotsProps) {
  return (
    <span
      role={label ? 'status' : undefined}
      aria-label={label ?? undefined}
      aria-hidden={label ? undefined : true}
      className={`inline-flex ${className}`}
    >
      <Lottie
        src={loadingDotsAnimation}
        aria-hidden="true"
        loop
        autoplay
      />
    </span>
  );
}
