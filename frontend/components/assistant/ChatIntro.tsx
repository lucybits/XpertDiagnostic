'use client';

import Image from 'next/image';
import type { ChatIntroMode } from '@/types/assistant';

/**
 * Portada del chat vacío (P-65): invita a escribir antes del primer mensaje.
 * Con paciente (P-100) dice en qué sección se empieza y qué escribir. De quién es el expediente se
 * ve fijo en el encabezado de la sección (P-101).
 * @pre se muestra solo si no hay mensajes ni burbujas pendientes.
 */
export default function ChatIntro({
  name,
  mode,
  groupLabel,
  sectionLabel,
  position,
}: {
  name: string;
  mode: ChatIntroMode;
  groupLabel: string;
  sectionLabel: string;
  /** Posición de la sección (1 = primera): "Empecemos con…" o "Sigamos con…". */
  position: number;
}) {
  // Cada texto va en dos líneas para que no se vea tan alargado (P-66).
  const title: readonly [string, string] =
    mode === 'patient'
      ? [`${position === 1 ? 'Empecemos con' : 'Sigamos con'} ${groupLabel.toLowerCase()}:`, sectionLabel]
      : ['Te damos la bienvenida a', 'XpertDiagnostic'];
  const subtitle: readonly [string, string] =
    mode === 'patient'
      ? ['Elige de la base de conocimiento lo que presenta el paciente', 'y guarda la sección para continuar.']
      : [`Hola, ${name}.`, 'Escríbeme en el chat de abajo para comenzar.'];

  // Con paciente, la portada es compacta: debajo va la tarjeta de captura de la sección (P-103).
  const isPatient = mode === 'patient';

  return (
    <div
      className={`relative flex flex-col overflow-hidden px-4 pt-16 transition-opacity duration-500 starting:opacity-0 motion-reduce:transition-none sm:px-8 ${
        isPatient ? 'flex-none pb-5' : 'flex-[1_0_auto] justify-center pb-10'
      }`}
    >
      {!isPatient && <DecorativeCrosses />}

      <div className="relative mx-auto w-full max-w-4xl">
        {!isPatient && (
          <span className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-slate-200 bg-white">
            <Image src="/logoxd.png" alt="" width={32} height={32} className="h-8 w-8 object-contain" />
          </span>
        )}
        <h2
          className={`leading-[1.1] font-bold tracking-tight text-[#0b1533] ${
            isPatient ? 'text-3xl sm:text-4xl' : 'text-4xl sm:text-5xl lg:text-6xl'
          }`}
        >
          {title[0]} <br className="hidden sm:block" />
          {title[1]}
        </h2>
        <p className={`leading-relaxed text-slate-600 ${isPatient ? 'mt-3 text-lg' : 'mt-4 text-lg sm:text-xl'}`}>
          {subtitle[0]} <br className="hidden sm:block" />
          {subtitle[1]}
        </p>

      </div>
    </div>
  );
}

/** Cruces médicas estáticas de fondo (sin animación ni desenfoque, para no afectar la fluidez; A-10). */
function DecorativeCrosses() {
  const crosses = [
    { x: 78, y: 4, s: 15, c: '#dbeafe' },
    { x: 90, y: 22, s: 9, c: '#ccfbf1' },
    { x: 66, y: 18, s: 6, c: '#e0f2fe' },
    { x: 84, y: 48, s: 11, c: '#e0f2fe' },
    { x: 95, y: 70, s: 5, c: '#dbeafe' },
    { x: 4, y: 80, s: 8, c: '#ccfbf1' },
    { x: 14, y: 92, s: 4, c: '#dbeafe' },
  ];
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
    >
      {crosses.map(({ x, y, s, c }) => (
        <path
          key={`${x}-${y}`}
          fill={c}
          d={`M${x - s / 6} ${y - s / 2}h${s / 3}v${s / 3}h${s / 3}v${s / 3}h${-s / 3}v${s / 3}h${-s / 3}v${-s / 3}h${-s / 3}v${-s / 3}h${s / 3}z`}
        />
      ))}
    </svg>
  );
}
