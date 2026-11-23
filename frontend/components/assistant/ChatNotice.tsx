'use client';

import { useId, useState } from 'react';
import { FOCUS_RING } from './styles';

/**
 * Aviso de uso clínico al final de la conversación; se desplaza con ella, sin divisor (P-81, P-82).
 * "Más información" despliega una explicación breve (P-115); antes no hacía nada.
 */
export default function ChatNotice() {
  const [isOpen, setIsOpen] = useState(false);
  const detailId = useId();

  return (
    <div className="mx-auto w-full max-w-4xl shrink-0 px-4 pt-6 pb-5 text-center text-xs text-slate-700 sm:px-8">
      <p>
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          aria-controls={detailId}
          className={`cursor-pointer rounded font-medium text-[#0b1533] underline underline-offset-2 hover:text-[#116ee6] ${FOCUS_RING}`}
        >
          {isOpen ? 'Menos información' : 'Más información'}
        </button>
      </p>
      <p id={detailId} hidden={!isOpen} className="mx-auto mt-2 max-w-2xl text-slate-800">
        XpertDiagnostic compara los hallazgos que capturas con su base de conocimiento y propone un diagnóstico
        diferencial con los datos que apoyan cada opción. Es una herramienta de apoyo: no sustituye la valoración
        clínica. El motor de análisis actual es provisional y los pacientes de prueba son ficticios.
      </p>
    </div>
  );
}
