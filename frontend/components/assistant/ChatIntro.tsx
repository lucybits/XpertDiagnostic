'use client';

import Image from 'next/image';

/**
 * Portada del chat vacío (P-65): invita a escribir antes del primer mensaje. Solo sin paciente;
 * con paciente, el encabezado de la sección ya orienta al médico (P-127).
 * @pre se muestra solo si no hay mensajes ni burbujas pendientes.
 */
export default function ChatIntro({ name }: { name: string }) {
  // Cada texto va en dos líneas para que no se vea tan alargado (P-66).
  const title = ['Te damos la bienvenida a', 'XpertDiagnostic'] as const;
  const subtitle = [`Hola, ${name}.`, 'Escríbeme en el chat de abajo para comenzar.'] as const;

  return (
    <div className="relative flex flex-[1_0_auto] flex-col justify-center overflow-hidden px-4 pt-16 pb-10 transition-opacity duration-500 starting:opacity-0 motion-reduce:transition-none sm:px-8">
      <div className="relative mx-auto w-full max-w-4xl">
        <span className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-slate-200 bg-white">
          <Image src="/logoxd.png" alt="" width={32} height={32} className="h-8 w-8 object-contain" />
        </span>
        <h2 className="text-[2rem] leading-[1.1] font-bold tracking-tight text-[#0b1533] sm:text-[2.375rem] lg:text-[2.875rem]">
          {title[0]} <br className="hidden sm:block" />
          {title[1]}
        </h2>
        <p className="mt-4 text-lg leading-relaxed text-slate-800 sm:text-xl">
          {subtitle[0]} <br className="hidden sm:block" />
          {subtitle[1]}
        </p>
      </div>
    </div>
  );
}
