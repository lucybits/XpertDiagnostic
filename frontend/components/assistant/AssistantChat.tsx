'use client';

import { useEffect, useRef, useState, type UIEvent } from 'react';
import type { ClinicalSection } from '@/components/home/clinicalSections';
import {
  TOUR_START,
  WELCOME_ACCEPT_STEP,
  WELCOME_LAST_STEP,
  WELCOME_STEPS,
  endsGroup,
  isLastBubble,
  nextBubble,
  nextStep,
  thinkingTime,
  welcomeMessage,
} from '@/lib/welcomeTour';
import type { ChatMessage, TourPosition } from '@/types/assistant';
import type { Patient } from '@/types/patient';
import type { DiagnosisResult, PatientRecord } from '@/types/record';
import ChatComposer from './ChatComposer';
import ChatIntro from './ChatIntro';
import { AssistantMessage, DoctorMessage, ThinkingIndicator } from './ChatMessages';
import ChatNotice from './ChatNotice';
import DiagnosisPanel from './DiagnosisPanel';
import SectionCapture from './SectionCapture';
import SectionHeader, { ShowSectionHeaderButton } from './SectionHeader';
import SessionPatientPill from './SessionPatientPill';

type AssistantChatProps = {
  groupLabel: string;
  section: ClinicalSection;
  /** Posición de la sección (1..total) para el indicador de avance. */
  position: number;
  total: number;
  /** Encabezado oculto por completo (lo recuerda HomeScreen al cambiar de sección). */
  isHeaderCollapsed: boolean;
  onToggleHeader: () => void;
  patient: Patient | null;
  /** Nombre del médico para la portada y el saludo de la bienvenida. */
  doctorName: string;
  /** Se llama al aceptar el aviso clínico: HomeScreen lo registra en la cuenta. */
  onWelcomeAccepted: () => void;
  onSearchPatient: () => void;
  /** Expediente capturado del paciente (null mientras carga o sin paciente). */
  record: PatientRecord | null;
  /** Se guardó la sección actual: HomeScreen la marca y pasa a la siguiente (P-103). */
  onSectionSaved: (record: PatientRecord) => void;
  /** Último análisis del paciente, si ya se hizo. */
  diagnosis: DiagnosisResult | null;
  /** Se guardaron hallazgos después del análisis (P-112). */
  isDiagnosisStale: boolean;
  onAnalyzed: (result: DiagnosisResult) => void;
  /** Se confirmó un diagnóstico (P-111). */
  onDiagnosisConfirmed: (diseaseName: string) => void;
};

/**
 * Chat del asistente de IA en el centro de la pantalla principal (contenedor de components/assistant).
 * Guarda el estado de la conversación y decide qué se puede hacer en cada momento; el guion y sus
 * reglas viven en lib/welcomeTour y las piezas visuales en este mismo directorio.
 *
 * Sin paciente, el primer mensaje del médico arranca la bienvenida guiada (ESP-003, P-71), aunque
 * la cuenta ya la haya visto. Los mensajes del médico se agregan localmente; todavía no hay
 * respuestas reales de la IA.
 * Se monta de nuevo al cambiar de sección o de paciente (key en HomeScreen).
 */
export default function AssistantChat({
  groupLabel,
  section,
  position,
  total,
  isHeaderCollapsed,
  onToggleHeader,
  patient,
  doctorName,
  onWelcomeAccepted,
  onSearchPatient,
  record,
  onSectionSaved,
  diagnosis,
  isDiagnosisStale,
  onAnalyzed,
  onDiagnosisConfirmed,
}: AssistantChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  // Burbuja de la bienvenida que el asistente está "pensando" (muestra loading.svg); null si no piensa.
  const [pending, setPending] = useState<TourPosition | null>(null);
  // La bienvenida espera el primer mensaje del médico.
  const [welcomeStarted, setWelcomeStarted] = useState(false);
  // Mensajes que ya terminaron de escribirse: hasta entonces no se muestra su botón.
  const [typedIds, setTypedIds] = useState<ReadonlySet<string>>(() => new Set());
  const [draft, setDraft] = useState('');
  // Detener (P-83): burbuja que se está cortando y burbuja con la que se retoma al siguiente mensaje.
  const [stoppingId, setStoppingId] = useState<string | null>(null);
  const [resumeFrom, setResumeFrom] = useState<TourPosition | null>(null);
  const listEndRef = useRef<HTMLDivElement>(null);
  // Píldora del paciente (P-104): se esconde al bajar y vuelve al subir o cerca del inicio.
  const [isPillHidden, setIsPillHidden] = useState(false);
  const lastScrollTopRef = useRef(0);
  const draftRef = useRef<HTMLTextAreaElement>(null);
  // Burbujas que ya terminaron de escribirse y ya encolaron la siguiente.
  const advancedIdsRef = useRef<Set<string>>(new Set());

  const lastMessage = messages.at(-1);
  // El asistente está pensando o escribiendo: el médico espera a que termine.
  const assistantBusy =
    pending !== null || (lastMessage?.typewriter === true && !typedIds.has(lastMessage.id));
  // Paso de la bienvenida que espera respuesta del médico (su última burbuja ya se escribió), o null.
  const waitingStep =
    !assistantBusy &&
    lastMessage?.author === 'assistant' &&
    lastMessage.welcomeStep !== undefined &&
    isLastBubble(lastMessage)
      ? lastMessage.welcomeStep
      : null;
  // Sin paciente, el primer mensaje arranca la bienvenida, siempre (P-65, P-71).
  const awaitingWelcome = patient === null && !welcomeStarted;
  // Durante la bienvenida, cada respuesta escrita avanza al paso siguiente (P-69). El último paso
  // (buscar paciente) se resuelve con su botón.
  const canReplyToWelcome = waitingStep !== null && waitingStep !== WELCOME_LAST_STEP;
  // Con paciente, la captura se hace en la tarjeta de la sección: el chat con la IA todavía no
  // responde ni guarda lo escrito, así que no se ofrece escribir (P-115).
  const canWrite = !assistantBusy && (awaitingWelcome || canReplyToWelcome || resumeFrom !== null);
  const isEmpty = messages.length === 0 && pending === null;

  // Cuando el asistente termina y se puede responder, el cursor vuelve al cuadro de texto.
  useEffect(() => {
    if (canWrite && welcomeStarted) draftRef.current?.focus();
  }, [canWrite, welcomeStarted]);

  // Mantiene visible el último mensaje.
  useEffect(() => {
    // Con el chat vacío no se baja: la portada debe verse desde arriba.
    if (messages.length === 0 && pending === null) return;
    listEndRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [messages, pending, typedIds]);

  // Tras "pensar", el asistente publica el mensaje del paso pendiente.
  useEffect(() => {
    if (pending === null) return;
    const timer = window.setTimeout(() => {
      const message = welcomeMessage(pending, doctorName, Date.now());
      // Nunca dos veces la misma burbuja (el id identifica paso y burbuja).
      setMessages((current) => (current.some((m) => m.id === message.id) ? current : [...current, message]));
      setPending(null);
    }, thinkingTime(pending));
    return () => window.clearTimeout(timer);
  }, [pending, doctorName]);

  // Al terminar de escribir una burbuja, si el paso tiene más, el asistente "piensa" la siguiente.
  const markTyped = (message: ChatMessage) => {
    // Cada burbuja avanza a la siguiente una sola vez, aunque se avise de nuevo que terminó.
    if (advancedIdsRef.current.has(message.id)) return;
    advancedIdsRef.current.add(message.id);
    setTypedIds((current) => (current.has(message.id) ? current : new Set(current).add(message.id)));
    if (message.welcomeStep !== undefined && !isLastBubble(message)) {
      setPending(nextBubble(message));
    }
  };

  // Pasa al siguiente paso de la bienvenida; responder al aviso clínico cuenta como aceptarlo.
  const advanceWelcome = (step: number) => {
    if (step === WELCOME_ACCEPT_STEP) onWelcomeAccepted();
    setPending(nextStep(step));
  };

  const send = () => {
    const clean = draft.trim();
    if (!clean || !canWrite) return;
    setMessages((current) => [...current, { id: `doctor-${current.length}`, author: 'doctor', text: clean, sentAt: Date.now() }]);
    setDraft('');
    if (awaitingWelcome) {
      setWelcomeStarted(true);
      setPending(TOUR_START);
    } else if (resumeFrom !== null) {
      // Tras detenerlo, el siguiente mensaje retoma el recorrido donde se quedó.
      setPending(resumeFrom);
      setResumeFrom(null);
    } else if (canReplyToWelcome) {
      advanceWelcome(waitingStep);
    }
  };

  // Detener: si piensa, no publica nada; si escribe, corta la burbuja en la palabra actual.
  const stop = () => {
    if (pending !== null) {
      setResumeFrom(pending);
      setPending(null);
    } else if (lastMessage?.typewriter && !typedIds.has(lastMessage.id)) {
      setStoppingId(lastMessage.id);
    }
  };

  // La burbuja cortada se queda con el texto que alcanzó a aparecer (o se quita si no apareció nada).
  const handleStopped = (message: ChatMessage, visibleWords: number) => {
    advancedIdsRef.current.add(message.id);
    setStoppingId(null);
    if (visibleWords === 0) {
      setMessages((current) => current.filter((m) => m.id !== message.id));
      if (message.welcomeStep !== undefined) {
        setResumeFrom({ step: message.welcomeStep, bubble: message.welcomeBubble ?? 0 });
      }
      return;
    }
    setMessages((current) =>
      current.map((m) => (m.id === message.id ? { ...m, visibleWords, typewriter: false, stopped: true } : m)),
    );
    setTypedIds((current) => new Set(current).add(message.id));
    // Si era la última burbuja del paso, queda su botón y responder avanza como siempre.
    if (message.welcomeStep !== undefined && !isLastBubble(message)) {
      setResumeFrom(nextBubble(message));
    }
  };

  // Reintentar (P-90): la burbuja detenida se quita y el asistente la vuelve a pensar y escribir
  // completa, desde el principio.
  const canRetry = (message: ChatMessage) =>
    message.stopped === true && message === lastMessage && !assistantBusy && message.welcomeStep !== undefined;

  const retry = (message: ChatMessage) => {
    if (!canRetry(message) || message.welcomeStep === undefined) return;
    advancedIdsRef.current.delete(message.id);
    setTypedIds((current) => {
      const next = new Set(current);
      next.delete(message.id);
      return next;
    });
    setMessages((current) => current.filter((m) => m.id !== message.id));
    setResumeFrom(null);
    setPending({ step: message.welcomeStep, bubble: message.welcomeBubble ?? 0 });
  };

  // Dirección del scroll del chat: ignora movimientos menores a 8 px para que la píldora no parpadee.
  const handleConversationScroll = (event: UIEvent<HTMLDivElement>) => {
    const top = event.currentTarget.scrollTop;
    const delta = top - lastScrollTopRef.current;
    if (top < 24) setIsPillHidden(false);
    else if (delta > 8) setIsPillHidden(true);
    else if (delta < -8) setIsPillHidden(false);
    else return;
    lastScrollTopRef.current = top;
  };

  // Botón del paso: atajo que responde con el texto del botón.
  const handleWelcomeAction = (step: number) => {
    if (step === WELCOME_LAST_STEP) {
      onSearchPatient();
      return;
    }
    setMessages((current) => [
      ...current,
      { id: `welcome-reply-${step}`, author: 'doctor', text: WELCOME_STEPS[step].action, sentAt: Date.now() },
    ]);
    advanceWelcome(step);
  };

  // Autor de lo que sigue a cada mensaje (el asistente "pensando" cuenta como suyo): la hora va
  // solo bajo el último mensaje de cada grupo seguido del mismo autor (P-87).
  const nextAuthorOf = (index: number): ChatMessage['author'] | null =>
    messages[index + 1]?.author ?? (pending !== null ? 'assistant' : null);
  // La hora del asistente aparece cuando dejó de responder: su grupo terminó y la burbuja ya se
  // escribió por completo, así no compite con la animación de carga ni con la escritura (P-89).
  const showsTime = (message: ChatMessage, index: number) =>
    endsGroup(message, nextAuthorOf(index)) && (!message.typewriter || typedIds.has(message.id));

  // El botón del paso aparece bajo la última burbuja del paso, ya escrita, si nada más está en curso.
  const showsAction = (message: ChatMessage) =>
    message.welcomeStep !== undefined &&
    message === lastMessage &&
    pending === null &&
    isLastBubble(message) &&
    (!message.typewriter || typedIds.has(message.id));

  const placeholder = awaitingWelcome
    ? 'Escribe un mensaje para empezar…'
    : assistantBusy
      ? 'XpertDiagnostic está escribiendo…'
      : canReplyToWelcome || resumeFrom !== null
        ? 'Escribe tu respuesta para continuar…'
        : 'Selecciona un paciente para comenzar';

  return (
    <section aria-label="Asistente XpertDiagnostic" className="flex h-full min-h-0 flex-col bg-white">
      <SectionHeader
        groupLabel={groupLabel}
        section={section}
        position={position}
        total={total}
        isCollapsed={isHeaderCollapsed}
        onToggle={onToggleHeader}
      />

      {/* Conversación */}
      <div className="relative min-h-0 flex-1">
        {/* Paciente de la sesión, fijo arriba a la izquierda (P-101); a la derecha, el botón del encabezado. */}
        {patient && <SessionPatientPill patient={patient} hidden={isPillHidden} />}
        {isHeaderCollapsed && <ShowSectionHeaderButton sectionLabel={section.label} onShow={onToggleHeader} />}
        <div onScroll={handleConversationScroll} className="relative flex h-full flex-col overflow-y-auto scrollbar-thin">
          {/* Con paciente no hay portada: el encabezado ya dice grupo, paso y sección (P-127). */}
          {isEmpty && patient === null && <ChatIntro name={doctorName} />}
          {/* Captura estructurada de la sección (P-103): elegir del catálogo y guardar; al final, analizar. */}
          {patient && (
            <div className="pt-16">
              {section.capture.kind === 'analysis' ? (
                <DiagnosisPanel
                  patientId={patient.id}
                  result={diagnosis}
                  isStale={isDiagnosisStale}
                  onAnalyzed={onAnalyzed}
                  onConfirmed={onDiagnosisConfirmed}
                  confirmedName={patient.diagnosis}
                />
              ) : (
                <SectionCapture
                  patientId={patient.id}
                  sectionLabel={section.label}
                  capture={section.capture}
                  record={record}
                  onSaved={onSectionSaved}
                />
              )}
            </div>
          )}
          {/* La conversación empieza arriba, con margen amplio: no queda pegada al borde ni bajo el botón
              del encabezado o la lengüeta de la barra (P-77). */}
          <ol
            hidden={isEmpty}
            aria-label="Conversación"
            className="mx-auto flex w-full max-w-4xl flex-[1_0_auto] flex-col gap-6 px-4 pt-[clamp(4.5rem,12vh,7rem)] pb-8 sm:px-8"
          >
            {messages.map((message, index) =>
              message.author === 'assistant' ? (
                <AssistantMessage
                  key={message.id}
                  message={message}
                  showTime={showsTime(message, index)}
                  showAction={showsAction(message)}
                  onRetry={canRetry(message) ? () => retry(message) : undefined}
                  onAction={handleWelcomeAction}
                  isStopping={stoppingId === message.id}
                  onTyped={markTyped}
                  onStopped={handleStopped}
                />
              ) : (
                <DoctorMessage
                  key={message.id}
                  message={message}
                  showTime={showsTime(message, index)}
                />
              ),
            )}
            {pending !== null && <ThinkingIndicator continuation={pending.bubble > 0} />}
          </ol>
          <ChatNotice />
          <div ref={listEndRef} />
        </div>
      </div>

      {/* El chat solo existe en la introducción, sin paciente. En la interfaz de entrada se captura en
          las tarjetas: el motor de inferencia es propio y no hay conversación con una IA (P-138). */}
      {patient === null && (
        <ChatComposer
          draft={draft}
          onDraftChange={setDraft}
          onSend={send}
          onStop={stop}
          canWrite={canWrite}
          isAssistantBusy={assistantBusy}
          placeholder={placeholder}
          autoFocus={awaitingWelcome}
          textareaRef={draftRef}
        />
      )}
    </section>
  );
}
