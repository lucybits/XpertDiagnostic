'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Image from 'next/image';
import LoginForm from '@/components/auth/LoginForm';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function subscribeToReducedMotion(onChange: () => void) {
  const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
  mediaQuery.addEventListener('change', onChange);
  return () => mediaQuery.removeEventListener('change', onChange);
}

const getReducedMotion = () => window.matchMedia(REDUCED_MOTION_QUERY).matches;
const getServerReducedMotion = () => false;

const BACKGROUND_REVEAL_MS = 2200;
const LOGIN_REVEAL_MS = 4200;

/**
 * Milisegundos desde que empezó, en pantalla, la animación de las letras.
 * Las letras se animan con CSS desde el primer pintado, antes de que React cargue; si React llega
 * tarde (p. ej. mientras el servidor de desarrollo compila), la secuencia se pone al día en vez de
 * empezar de cero o quedarse detenida (P-72).
 * @post devuelve un valor >= 0; 0 si el navegador no expone las animaciones.
 */
function elapsedSinceSplashStart(title: HTMLElement | null): number {
  const now = document.timeline?.currentTime;
  if (title === null || typeof now !== 'number' || typeof title.getAnimations !== 'function') return 0;
  const starts = title
    .getAnimations({ subtree: true })
    .map((animation) => animation.startTime)
    .filter((start): start is number => typeof start === 'number');
  return starts.length === 0 ? 0 : Math.max(0, now - Math.min(...starts));
}

/**
 * Página de inicio de sesión: animación de entrada, panel informativo y formulario.
 * La lógica del formulario vive en components/auth/LoginForm.
 */
export default function LoginPage() {
  const [isBackgroundRevealed, setIsBackgroundRevealed] = useState<boolean>(false);
  const [isLoginRevealed, setIsLoginRevealed] = useState<boolean>(false);
  const prefersReducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotion,
    getServerReducedMotion,
  );

  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    // Lo que falta de cada etapa, medido desde que empezaron las letras (no desde que cargó React).
    const elapsed = prefersReducedMotion ? Infinity : elapsedSinceSplashStart(titleRef.current);
    const backgroundRevealTimeout = setTimeout(
      () => setIsBackgroundRevealed(true),
      Math.max(0, BACKGROUND_REVEAL_MS - elapsed),
    );
    const loginRevealTimeout = setTimeout(
      () => setIsLoginRevealed(true),
      Math.max(0, LOGIN_REVEAL_MS - elapsed),
    );

    return () => {
      clearTimeout(backgroundRevealTimeout);
      clearTimeout(loginRevealTimeout);
    };
  }, [prefersReducedMotion]);

  return (
    <main
      className={`relative isolate flex min-h-dvh flex-col items-center bg-white px-3 pt-3 pb-7 sm:px-4 sm:pt-4 ${
        isLoginRevealed
          ? 'h-auto justify-center overflow-x-hidden'
          : 'h-dvh justify-center overflow-hidden'
      }`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 bg-[url('/bg.png')] bg-center bg-cover bg-no-repeat"
        style={{
          clipPath: isBackgroundRevealed ? 'circle(150vmax at 50% 50%)' : 'circle(0 at 50% 50%)',
          transition: prefersReducedMotion
            ? 'none'
            : 'clip-path 900ms cubic-bezier(0.76, 0, 0.24, 1)',
        }}
      />
      <div
        className={`relative z-10 flex w-full max-w-4xl flex-col items-center ${
          isLoginRevealed ? 'flex-none' : 'flex-1 justify-center'
        }`}
      >
        <h1
          ref={titleRef}
          aria-label="XpertDiagnostic"
          className={`absolute left-1/2 z-20 w-max max-w-[calc(100vw-2rem)] whitespace-nowrap text-center leading-none font-bold tracking-wide text-white drop-shadow ${
            isLoginRevealed
              ? 'text-base sm:text-lg'
              : 'text-[clamp(1.5rem,6vw,2.25rem)]'
          }`}
          style={{
            top: isLoginRevealed ? '0' : '50%',
            transform: isLoginRevealed
              ? 'translate(-50%, 0)'
              : 'translate(-50%, -50%)',
            color: isBackgroundRevealed ? '#fff' : '#0f172a',
            transition: prefersReducedMotion
              ? 'none'
              : 'top 900ms cubic-bezier(0.22, 1, 0.36, 1), transform 900ms cubic-bezier(0.22, 1, 0.36, 1), font-size 900ms cubic-bezier(0.22, 1, 0.36, 1), color 400ms ease 250ms',
          }}
        >
          {'XpertDiagnostic'.split('').map((character, index) => (
            <span
              key={`${character}-${index}`}
              aria-hidden="true"
              className="splash-letter inline-block animate-splash-letter motion-reduce:animate-none"
              style={{ animationDelay: `${index * 65}ms` }}
            >
              {character}
            </span>
          ))}
        </h1>

        <div
          aria-hidden="true"
          className={isLoginRevealed ? 'h-5 w-full shrink-0' : 'hidden'}
        />

        <div
          aria-hidden={!isLoginRevealed}
          inert={!isLoginRevealed}
          className={`mt-3 grid w-full max-w-4xl grid-cols-1 overflow-hidden rounded-md border-2 border-slate-200 bg-white transition-[opacity,transform] duration-[800ms] delay-100 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none lg:grid-cols-2 ${
            isLoginRevealed
              ? 'relative translate-y-0 opacity-100'
              : 'pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 translate-y-6 opacity-0'
          }`}
        >
        <section className="relative isolate flex min-h-[clamp(7.5rem,18svh,10rem)] flex-col items-center justify-center bg-slate-100 px-6 py-5 text-center lg:min-h-[min(70svh,42rem)] lg:justify-start lg:p-9">
          <div className="relative z-10 flex flex-col items-center justify-center">
            {/* Logo decorativo: el nombre del sistema ya está en el encabezado h1. */}
            <Image
              src="/logoxd.png"
              alt=""
              width={56}
              height={56}
              className="h-12 w-12 shrink-0 object-contain lg:h-14 lg:w-14"
              priority
            />
            <p className="mt-1 text-[length:clamp(0.9375rem,2.7svh,1.0625rem)] text-slate-700">
              Sistema experto para análisis médicos
            </p>
          </div>
          <div className="relative z-10 mt-6 w-full max-w-sm max-[1023px]:hidden lg:mt-8 lg:pt-8">
            <div className="relative mx-auto h-[clamp(10rem,30svh,20rem)] w-full">
              <Image
                src="/footer-image.png"
                alt="Ilustración de personal médico"
                fill
                sizes="(max-width: 1023px) 100vw, 448px"
                className="-translate-y-8 scale-150 object-contain"
              />
            </div>
            <p className="mt-3 text-center text-base leading-relaxed text-slate-700">
              Si olvidaste tu contraseña, comunícate con soporte técnico para recuperarla.
            </p>
          </div>
        </section>

        <LoginForm />
        </div>
      </div>
    </main>
  );
}
