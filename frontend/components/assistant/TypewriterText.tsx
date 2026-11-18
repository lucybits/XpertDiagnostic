'use client';

import { useEffect, useMemo, useRef } from 'react';
import { parseChatMarkup } from '@/lib/chatMarkup';
import { TYPING_PACE } from '@/lib/typingPace';
import ChatMarkup from './ChatMarkup';

type TypewriterTextProps = {
  /** Texto con el formato de lib/chatMarkup (negritas y listas, P-96). */
  text: string;
  /** Espera media entre una palabra y la siguiente (cada una varía ±30 % y hay pausas tras la puntuación). */
  wordDelayMs?: number;
  /** Se llama cuando la última palabra terminó de aparecer (o de inmediato con movimiento reducido). */
  onDone?: () => void;
  /** Al pasar a true, la escritura se detiene en la palabra actual (P-83). */
  stopped?: boolean;
  /**
   * Se llama una vez al detenerse, con cuántas palabras alcanzaron a aparecer (0 si ninguna).
   * @post después de esto no se llama onDone.
   */
  onStopped?: (visibleWords: number) => void;
};

// Todos los tiempos se escalan con TYPING_PACE (lib/typingPace.ts).
const WORD_DURATION_MS = 520 * TYPING_PACE;
const WORD_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';
// Pausas extra, como cuando un modelo de lenguaje termina una frase o una idea.
const PAUSE_AFTER_COMMA_MS = 170 * TYPING_PACE;
const PAUSE_AFTER_SENTENCE_MS = 360 * TYPING_PACE;
// Al terminar un párrafo o un elemento de lista, como al pasar de renglón (P-96).
const PAUSE_AFTER_BLOCK_MS = 260 * TYPING_PACE;

/** Espera antes de la siguiente palabra: ritmo irregular y pausas tras la puntuación y los renglones. */
function nextWordGap(word: HTMLElement, averageMs: number): number {
  const jitter = averageMs * (0.7 + Math.random() * 0.6);
  const text = word.textContent ?? '';
  if (/[.:;!?]$/.test(text)) return jitter + PAUSE_AFTER_SENTENCE_MS;
  if (word.hasAttribute('data-block-end')) return jitter + PAUSE_AFTER_BLOCK_MS;
  if (/,$/.test(text)) return jitter + PAUSE_AFTER_COMMA_MS;
  return jitter;
}

/**
 * Máquina de escribir con barrido: las palabras entran una tras otra pasando de transparentes y
 * difuminadas a nítidas. Todo el texto ocupa su lugar desde el inicio, así que el contenedor no
 * cambia de tamaño mientras se escribe. Anima solo al montarse (Web Animations API, sin re-renders).
 *
 * El texto completo está en el DOM desde el principio, así que el lector de pantalla lo lee entero.
 */
export default function TypewriterText({ text, wordDelayMs = 100, onDone, stopped = false, onStopped }: TypewriterTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const blocks = useMemo(() => parseChatMarkup(text), [text]);
  const onDoneRef = useRef(onDone);
  const onStoppedRef = useRef(onStopped);
  const animationsRef = useRef<Animation[]>([]);
  // Si React vuelve a ejecutar el efecto (Strict Mode, Fast Refresh), no se reescribe ni se avisa dos veces.
  const isDoneRef = useRef(false);

  useEffect(() => {
    onDoneRef.current = onDone;
    onStoppedRef.current = onStopped;
  }, [onDone, onStopped]);

  useEffect(() => {
    if (isDoneRef.current) return;
    const finish = () => {
      if (isDoneRef.current) return;
      isDoneRef.current = true;
      onDoneRef.current?.();
    };

    const words = containerRef.current?.querySelectorAll<HTMLSpanElement>('[data-word]');
    if (!words || words.length === 0) {
      finish();
      return;
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      finish();
      return;
    }

    let startAt = 0;
    const animations = Array.from(words, (word) => {
      const animation = word.animate(
        [
          { opacity: 0, filter: 'blur(6px)', transform: 'translateY(3px)' },
          { opacity: 1, filter: 'blur(0)', transform: 'translateY(0)' },
        ],
        { duration: WORD_DURATION_MS, delay: startAt, easing: WORD_EASING, fill: 'backwards' },
      );
      startAt += nextWordGap(word, wordDelayMs * TYPING_PACE);
      return animation;
    });
    animationsRef.current = animations;

    let cancelled = false;
    animations.at(-1)?.finished.then(
      () => {
        if (!cancelled) finish();
      },
      () => {},
    );

    return () => {
      cancelled = true;
      animations.forEach((animation) => animation.cancel());
    };
    // Anima solo al montarse: cada mensaje se escribe una vez.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Detener: las palabras que ya empezaron a aparecer se completan; las demás se quedan ocultas
  // (pausadas en su espera) hasta que quien la usa muestre solo las visibles.
  useEffect(() => {
    if (!stopped || isDoneRef.current) return;
    isDoneRef.current = true;
    let visibleWords = 0;
    for (const animation of animationsRef.current) {
      const delay = Number(animation.effect?.getTiming().delay ?? 0);
      const current = Number(animation.currentTime ?? 0);
      if (current > delay) {
        visibleWords += 1;
        animation.finish();
      } else {
        animation.pause();
      }
    }
    onStoppedRef.current?.(visibleWords);
  }, [stopped]);

  return (
    <div ref={containerRef}>
      <ChatMarkup blocks={blocks} />
    </div>
  );
}
