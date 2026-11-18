'use client';

import Image from 'next/image';
import { ArrowRight, RotateCcw, Search, ShieldCheck, UserPlus, UserRound, type LucideIcon } from 'lucide-react';
import { WELCOME_ACCEPT_STEP, WELCOME_LAST_STEP, WELCOME_STEPS, isContinuation } from '@/lib/welcomeTour';
import { parseChatMarkup } from '@/lib/chatMarkup';
import type { ChatMessage } from '@/types/assistant';
import ChatMarkup from './ChatMarkup';
import TypewriterText from './TypewriterText';
import { FOCUS_RING } from './styles';

const MESSAGE_ENTER =
  'transition-[opacity,translate] duration-300 ease-out starting:translate-y-1 starting:opacity-0 motion-reduce:transition-none';

/** Logo de XpertDiagnostic como avatar: más grande y sin círculo ni borde (P-91). */
function AssistantAvatar() {
  return (
    <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center">
      <Image src="/logoxd.png" alt="" width={32} height={32} className="h-8 w-8 object-contain" />
    </span>
  );
}

/** Nombre del asistente con su rol como insignia (P-97). */
function AssistantName() {
  return (
    <p className="mb-1.5 flex items-center gap-2 font-medium text-slate-900">
      XpertDiagnostic
      <span className="rounded-md bg-blue-100 px-2 py-0.5 text-sm leading-tight font-medium text-slate-800">
        Asistente clínico
      </span>
    </p>
  );
}

// Hora corta en español de México, p. ej. "4:05 p.m.".
const TIME_FORMAT = new Intl.DateTimeFormat('es-MX', { hour: 'numeric', minute: '2-digit' });

/** Botón para volver a generar una respuesta detenida (P-90). */
function RetryButton({ onRetry }: { onRetry: () => void }) {
  return (
    <button
      type="button"
      onClick={onRetry}
      aria-label="Reintentar respuesta"
      title="Reintentar respuesta"
      className={`ml-1.5 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 align-middle font-medium text-[#1e47c5] not-italic transition-colors hover:bg-blue-50 hover:text-[#0b1533] ${FOCUS_RING}`}
    >
      <RotateCcw aria-hidden="true" className="h-4 w-4" />
      Reintentar
    </button>
  );
}

/** Hora de envío bajo el último mensaje de un grupo (P-87), con nota opcional ("Respuesta detenida"). */
function MessageMeta({
  sentAt,
  note,
  align,
  onRetry,
}: {
  sentAt: number;
  note?: string;
  align: 'start' | 'end';
  onRetry?: () => void;
}) {
  // Sin una hora válida (p. ej. un mensaje creado antes de existir sentAt y conservado por Fast
  // Refresh) se omite la hora en vez de romper la pantalla (P-88).
  const hasTime = Number.isFinite(sentAt);
  if (!hasTime && !note) return null;
  return (
    <p className={`mt-1.5 text-sm text-slate-500 ${align === 'end' ? 'text-right' : ''}`}>
      {hasTime && <time dateTime={new Date(sentAt).toISOString()}>{TIME_FORMAT.format(sentAt)}</time>}
      {note && (
        <span className="italic">
          {hasTime ? ' | ' : ''}
          {note}
        </span>
      )}
      {onRetry && <RetryButton onRetry={onRetry} />}
    </p>
  );
}

/**
 * Ícono del botón de cada paso (P-93): la flecha al final indica avanzar (Continuar, Entendido);
 * el escudo al inicio, aceptar el aviso clínico; la lupa, abrir el buscador.
 */
function stepIcon(step: number): { icon: LucideIcon; position: 'leading' | 'trailing' } {
  if (step === WELCOME_LAST_STEP) return { icon: Search, position: 'leading' };
  if (step === WELCOME_ACCEPT_STEP) return { icon: ShieldCheck, position: 'leading' };
  return { icon: ArrowRight, position: 'trailing' };
}

/** Acción principal del paso de la bienvenida (P-93): el elemento con más peso visual bajo la burbuja. */
function StepAction({
  step,
  onAction,
  onSecondaryAction,
}: {
  step: number;
  onAction: (step: number) => void;
  onSecondaryAction: (step: number) => void;
}) {
  const { icon: Icon, position } = stepIcon(step);
  const secondary = WELCOME_STEPS[step].secondaryAction;
  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={() => onAction(step)}
        aria-haspopup={step === WELCOME_LAST_STEP ? 'dialog' : undefined}
        className={`group inline-flex min-h-11 items-center gap-2 rounded-xl bg-teal-400 px-5 py-2.5 text-base font-semibold text-black transition-[background-color,translate] duration-150 hover:bg-teal-300 active:translate-y-px motion-reduce:transition-none ${FOCUS_RING} focus-visible:ring-offset-2`}
      >
        {position === 'leading' && <Icon aria-hidden="true" className="h-5 w-5" />}
        {WELCOME_STEPS[step].action}
        {position === 'trailing' && (
          <Icon
            aria-hidden="true"
            className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none"
          />
        )}
      </button>
      {/* Acción secundaria (ESP-004): misma forma, con borde y sin relleno, para que la principal destaque. */}
      {secondary && (
        <button
          type="button"
          onClick={() => onSecondaryAction(step)}
          aria-haspopup="dialog"
          className={`inline-flex min-h-11 items-center gap-2 rounded-xl border-2 border-teal-500 px-5 py-2 text-base font-semibold text-teal-800 transition-[background-color,translate] duration-150 hover:bg-teal-50 active:translate-y-px motion-reduce:transition-none ${FOCUS_RING} focus-visible:ring-offset-2`}
        >
          <UserPlus aria-hidden="true" className="h-5 w-5" />
          {secondary}
        </button>
      )}
    </div>
  );
}

/** Hueco del ancho del avatar: las burbujas seguidas del asistente se alinean con la primera. */
function AvatarGap() {
  return <span aria-hidden="true" className="w-9 shrink-0" />;
}

type AssistantMessageProps = {
  message: ChatMessage;
  /** Último mensaje de su grupo: muestra la hora de envío. */
  showTime: boolean;
  /** Solo si la burbuja se detuvo y se puede volver a generar (P-90). */
  onRetry?: () => void;
  /** Muestra los botones del paso de la bienvenida bajo la burbuja. */
  showAction: boolean;
  onAction: (step: number) => void;
  onSecondaryAction: (step: number) => void;
  /** Se pidió detener esta burbuja mientras se escribe (P-83). */
  isStopping: boolean;
  onTyped: (message: ChatMessage) => void;
  onStopped: (message: ChatMessage, visibleWords: number) => void;
};

/** Burbuja del asistente (azul fuerte con texto blanco, P-78), con el botón del paso si corresponde. */
export function AssistantMessage({
  message,
  showTime,
  showAction,
  onRetry,
  onAction,
  onSecondaryAction,
  isStopping,
  onTyped,
  onStopped,
}: AssistantMessageProps) {
  const continuation = isContinuation(message);
  const step = message.welcomeStep;

  return (
    <li className={`flex items-start gap-3 ${MESSAGE_ENTER} ${continuation ? '-mt-4' : ''}`}>
      {/* Burbujas seguidas del asistente: avatar y nombre solo en la primera. */}
      {continuation ? <AvatarGap /> : <AssistantAvatar />}
      <div className="min-w-0 max-w-[88%]">
        {!continuation && <AssistantName />}
        {/* Azul fuerte entre blue-700 y blue-800 (#1e47c5), más claro que el azul marino del médico;
            contraste con blanco ≈ 7.6:1 (P-78, P-85). */}
        <div className="rounded-2xl rounded-tl-md bg-[#1e47c5] px-5 py-3.5 leading-relaxed text-white">
          {message.typewriter ? (
            <TypewriterText
              text={message.text}
              wordDelayMs={message.wordDelayMs}
              onDone={() => onTyped(message)}
              stopped={isStopping}
              onStopped={(visibleWords) => onStopped(message, visibleWords)}
            />
          ) : (
            <ChatMarkup blocks={parseChatMarkup(message.text)} maxWords={message.visibleWords} />
          )}
        </div>
        {showTime ? (
          <MessageMeta
            sentAt={message.sentAt}
            note={message.stopped ? 'Respuesta detenida' : undefined}
            align="start"
            onRetry={onRetry}
          />
        ) : (
          message.stopped && (
            <p className="mt-1.5 text-sm text-slate-500">
              <span className="italic">Respuesta detenida</span>
              {onRetry && <RetryButton onRetry={onRetry} />}
            </p>
          )
        )}

        {showAction && step !== undefined && (
          <StepAction step={step} onAction={onAction} onSecondaryAction={onSecondaryAction} />
        )}
      </div>
    </li>
  );
}

/** Mensaje del médico, alineado a la derecha con su avatar. */
export function DoctorMessage({ message, showTime }: { message: ChatMessage; showTime: boolean }) {
  return (
    <li className={`flex items-start justify-end gap-3 ${MESSAGE_ENTER}`}>
      <div className="flex max-w-[88%] min-w-0 flex-col items-end">
        <div className="rounded-2xl rounded-tr-md bg-[#0b1533] px-5 py-3.5 leading-relaxed whitespace-pre-wrap text-white">
          <span className="sr-only">Tú: </span>
          {message.text}
        </div>
        {showTime && <MessageMeta sentAt={message.sentAt} align="end" />}
      </div>
      <span
        aria-hidden="true"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-400 text-black"
      >
        <UserRound className="h-5 w-5" />
      </span>
    </li>
  );
}

/** XpertDiagnostic "pensando" antes de escribir: puntos animados sin burbuja. */
export function ThinkingIndicator({ continuation }: { continuation: boolean }) {
  return (
    <li
      className={`flex items-start gap-3 transition-opacity duration-300 starting:opacity-0 motion-reduce:transition-none ${
        continuation ? '-mt-4' : ''
      }`}
    >
      {continuation ? <AvatarGap /> : <AssistantAvatar />}
      <div role="status" className="min-w-0">
        {!continuation && <AssistantName />}
        <div className="flex py-1.5">
          <Image src="/loading.svg" alt="" width={32} height={8} unoptimized className="h-2 w-8" />
          <span className="sr-only">XpertDiagnostic está escribiendo</span>
        </div>
      </div>
    </li>
  );
}
