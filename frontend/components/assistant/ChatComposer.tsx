'use client';

import type { FormEvent, KeyboardEvent, RefObject } from 'react';
import { ArrowRight, Square } from 'lucide-react';
import { FOCUS_RING } from './styles';

type ChatComposerProps = {
  draft: string;
  onDraftChange: (value: string) => void;
  /** Envía el borrador (Enter o el botón de enviar). */
  onSend: () => void;
  /** Detiene al asistente mientras piensa o escribe (P-83). */
  onStop: () => void;
  canWrite: boolean;
  /** El asistente está pensando o escribiendo: el botón de enviar se vuelve "Detener". */
  isAssistantBusy: boolean;
  placeholder: string;
  autoFocus: boolean;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
};

/**
 * Cuadro de redacción del chat, pegado al borde inferior: texto, dictado por voz (solo visual) y
 * enviar o detener. No decide cuándo se puede escribir: lo recibe del contenedor.
 */
export default function ChatComposer({
  draft,
  onDraftChange,
  onSend,
  onStop,
  canWrite,
  isAssistantBusy,
  placeholder,
  autoFocus,
  textareaRef,
}: ChatComposerProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSend();
  };

  // Enter envía; Shift + Enter hace salto de línea.
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      onSend();
    }
  };

  return (
    <div className="bg-white px-4 pt-1 pb-4 sm:px-8">
      <form onSubmit={handleSubmit} className="mx-auto w-full max-w-4xl">
        <div className="flex items-end gap-2 rounded-2xl border-2 border-slate-300 bg-white p-2 transition-colors focus-within:border-[#116ee6]">
          <label htmlFor="assistant-draft" className="sr-only">
            Mensaje para el asistente
          </label>
          <textarea
            id="assistant-draft"
            ref={textareaRef}
            rows={1}
            // Antes de la bienvenida, el cursor ya queda listo para escribir (P-68).
            autoFocus={autoFocus}
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!canWrite}
            placeholder={placeholder}
            className="max-h-40 min-h-11 flex-1 resize-none bg-transparent px-2 py-2.5 text-base text-slate-900 field-sizing-content placeholder:text-slate-500 focus:outline-none disabled:cursor-not-allowed"
          />
          {/* El dictado por voz se quitó: el botón no hacía nada (P-115). */}
          {/* Mientras el asistente piensa o escribe, el botón de enviar se vuelve "Detener" (P-83). */}
          {isAssistantBusy ? (
            <button
              type="button"
              onClick={onStop}
              aria-label="Detener respuesta"
              title="Detener respuesta"
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0b1533] text-white transition-colors hover:bg-[#1a2650] ${FOCUS_RING} focus-visible:ring-offset-2`}
            >
              <Square aria-hidden="true" className="h-4 w-4 fill-current" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!canWrite || draft.trim() === ''}
              aria-label="Enviar mensaje"
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#116ee6] text-white transition-colors hover:bg-[#2a80f0] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:bg-[#116ee6] ${FOCUS_RING} focus-visible:ring-offset-2`}
            >
              <ArrowRight aria-hidden="true" className="h-5 w-5" />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
