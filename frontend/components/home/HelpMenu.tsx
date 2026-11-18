'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { CircleHelp } from 'lucide-react';

const STEPS: readonly { title: string; detail: string }[] = [
  { title: 'Elige o registra un paciente', detail: '«Buscar paciente» o «Nuevo paciente» en la barra lateral.' },
  { title: 'Captura cada sección', detail: 'Marca en la tarjeta lo que presenta y pulsa «Guardar y continuar».' },
  { title: 'Analiza y confirma', detail: 'En «Diagnóstico diferencial», analiza y confirma uno de los candidatos.' },
  { title: 'Completa el resultado', detail: 'Elige el tratamiento, escribe el plan y descarga o imprime el PDF.' },
];

/**
 * Ayuda de la barra superior (P-115): explica el flujo en cuatro pasos. Antes el botón no hacía nada.
 * Se cierra con Escape o al hacer clic fuera, como el menú de cuenta.
 */
export default function HelpMenu({ buttonClassName }: { buttonClassName: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!isOpen) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-label="Ayuda: cómo funciona"
        title="Cómo funciona"
        className={buttonClassName}
      >
        <CircleHelp aria-hidden="true" className="h-5 w-5" />
      </button>

      <div
        id={panelId}
        hidden={!isOpen}
        className="absolute right-0 z-50 mt-3 w-80 rounded-xl border-2 border-slate-200 bg-white p-4 text-slate-900"
      >
        <p className="text-base font-semibold">Cómo funciona XpertDiagnostic</p>
        <ol className="mt-3 space-y-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="flex gap-3">
              <span
                aria-hidden="true"
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1e47c5] text-sm font-bold text-white"
              >
                {index + 1}
              </span>
              <span className="min-w-0">
                <span className="block font-medium">{step.title}</span>
                <span className="block text-sm text-slate-600">{step.detail}</span>
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-3 border-t-2 border-slate-100 pt-3 text-sm text-slate-600">
          El diagnóstico es orientativo y el motor actual es provisional; la decisión clínica es del médico.
        </p>
      </div>
    </div>
  );
}
