import type { ChatMessage, TourPosition, WelcomeStep } from '@/types/assistant';
import { TYPING_PACE } from './typingPace';

/**
 * Modelo de la bienvenida guiada del asistente (ESP-003): el guion y las reglas puras para
 * recorrerlo. No depende de React; la vista (components/assistant) solo lo consulta.
 *
 * Cada paso tiene una o varias burbujas seguidas y un botón que aparece al terminar la última.
 * El último paso abre el buscador de pacientes.
 */
export const WELCOME_STEPS: readonly WelcomeStep[] = [
  {
    action: 'Continuar',
    bubbles: [
      {
        text: (name) => `Hola, ${name}. Soy XpertDiagnostic, tu asistente de apoyo clínico.`,
        thinkingMs: 1300,
        wordDelayMs: 105,
      },
    ],
  },
  {
    action: 'Entendido',
    // Formato de lib/chatMarkup: **negritas** y líneas con "- " como viñetas (P-96).
    bubbles: [
      {
        text: () =>
          'Te explico cómo vamos a trabajar. El expediente se divide en **dos etapas** y avanzaremos por ellas **en orden, una sección a la vez**.',
        thinkingMs: 1800,
        wordDelayMs: 95,
      },
      {
        text: () =>
          [
            '**1. Antecedentes**',
            '- Enfermedades preexistentes',
            '- Comorbilidades',
            'En cada sección **eliges de la base de conocimiento** lo que presenta el paciente; así puedo compararlo con precisión.',
          ].join('\n'),
        thinkingMs: 1200,
        wordDelayMs: 80,
      },
      {
        text: () =>
          [
            '**2. Evaluación clínica**',
            '- Síntomas que refiere el paciente',
            '- Signos',
            '- Estudios de laboratorio',
            'Si tienes valores medidos, anótalos; ya muestro **las unidades** de cada uno para compararlos con los rangos de referencia.',
          ].join('\n'),
        thinkingMs: 1500,
        wordDelayMs: 85,
      },
      {
        text: () =>
          'Cada sección **se desbloquea al guardar la anterior**. Verás tu avance en la **barra lateral** y, a la derecha, en el **expediente**, se irán acumulando los hallazgos que registremos.',
        thinkingMs: 1000,
        wordDelayMs: 90,
      },
      {
        text: () =>
          [
            'Con toda esa información compararé los hallazgos del paciente con mi base de conocimiento médico y te propondré un **diagnóstico diferencial**: las enfermedades más probables, en orden, junto con los datos que apoyan cada una.',
            'Con el diagnóstico que elijas, te sugeriré:',
            '- Estudios complementarios',
            '- Un plan de tratamiento',
            '- Su seguimiento',
          ].join('\n'),
        thinkingMs: 2200,
        wordDelayMs: 85,
      },
    ],
  },
  {
    action: 'Acepto',
    bubbles: [
      {
        text: () => 'Mis sugerencias son orientativas y pueden contener errores. La decisión clínica siempre es tuya.',
        thinkingMs: 1700,
        wordDelayMs: 125,
      },
    ],
  },
  {
    action: 'Buscar paciente',
    bubbles: [
      {
        text: () =>
          'Para empezar, **busca al paciente** que registró el administrador. Después iremos capturando juntos su expediente, sección por sección: antecedentes, síntomas, signos y estudios.',
        thinkingMs: 1000,
        wordDelayMs: 95,
      },
    ],
  },
];

/** Paso del aviso clínico: responderlo cuenta como aceptarlo (RF-21, RF-25). */
export const WELCOME_ACCEPT_STEP = 2;
/** Último paso: se resuelve con "Buscar paciente" o "Nuevo paciente" (RF-22, ESP-004). */
export const WELCOME_LAST_STEP = WELCOME_STEPS.length - 1;

/** Primera posición del recorrido. */
export const TOUR_START: TourPosition = { step: 0, bubble: 0 };

/**
 * Cuánto "piensa" el asistente antes de escribir la burbuja indicada.
 * @pre position apunta a una burbuja existente del guion.
 */
export function thinkingTime({ step, bubble }: TourPosition): number {
  return WELCOME_STEPS[step].bubbles[bubble].thinkingMs * TYPING_PACE;
}

/**
 * Crea el mensaje del asistente para una burbuja del guion.
 * @pre position apunta a una burbuja existente del guion.
 * @post el id identifica paso y burbuja (`welcome-{paso}-{burbuja}`), así nunca se publica dos veces.
 * @post sentAt es el momento indicado (la hora en que el asistente la publica).
 */
export function welcomeMessage({ step, bubble }: TourPosition, name: string, sentAt: number): ChatMessage {
  const data = WELCOME_STEPS[step].bubbles[bubble];
  return {
    id: `welcome-${step}-${bubble}`,
    author: 'assistant',
    text: data.text(name),
    sentAt,
    welcomeStep: step,
    welcomeBubble: bubble,
    wordDelayMs: data.wordDelayMs,
    typewriter: true,
  };
}

/**
 * Indica si el mensaje cierra un grupo de mensajes seguidos del mismo autor: la hora se muestra
 * solo bajo el último del grupo (P-87).
 * @param nextAuthor autor de lo que sigue en la conversación (incluido el asistente "pensando"),
 *   o null si es lo último.
 */
export function endsGroup(message: ChatMessage, nextAuthor: ChatMessage['author'] | null): boolean {
  return nextAuthor !== message.author;
}

/** Burbuja que continúa a la anterior del mismo paso (se muestra sin avatar ni nombre). */
export function isContinuation(message: ChatMessage): boolean {
  return (message.welcomeBubble ?? 0) > 0;
}

/** Última burbuja de su paso: tras ella aparece el botón del paso. */
export function isLastBubble(message: ChatMessage): boolean {
  return (
    message.welcomeStep !== undefined && message.welcomeBubble === WELCOME_STEPS[message.welcomeStep].bubbles.length - 1
  );
}

/**
 * Posición de la burbuja que sigue a este mensaje dentro de su paso.
 * @pre message pertenece a la bienvenida y no es la última burbuja de su paso.
 */
export function nextBubble(message: ChatMessage): TourPosition {
  return { step: message.welcomeStep ?? 0, bubble: (message.welcomeBubble ?? 0) + 1 };
}

/**
 * Primera burbuja del paso siguiente.
 * @pre step < WELCOME_LAST_STEP.
 */
export function nextStep(step: number): TourPosition {
  return { step: step + 1, bubble: 0 };
}
