'use client';

import { Lottie } from 'lottie-react';
import loadingDotsAnimation from '../../public/loading-dots.json';

export default function LoadingDots() {
  return (
    <span
      role="status"
      aria-label="Iniciando sesión"
      className="inline-flex h-7 w-7"
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
