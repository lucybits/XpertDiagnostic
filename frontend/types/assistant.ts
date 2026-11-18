/** Tipos del chat del asistente XpertDiagnostic (modelo de la conversación y de la bienvenida). */

/**
 * Un mensaje de la conversación.
 * @inv welcomeBubble solo está definido si welcomeStep lo está.
 * @inv stopped solo es true en mensajes del asistente.
 */
export type ChatMessage = {
  id: string;
  author: 'assistant' | 'doctor';
  text: string;
  /** Momento de envío (ms desde época), para mostrar la hora (P-87). */
  sentAt: number;
  /** Paso de la bienvenida al que pertenece el mensaje (muestra su botón tras la última burbuja). */
  welcomeStep?: number;
  /** Número de burbuja dentro del paso. */
  welcomeBubble?: number;
  /** Ritmo medio por palabra al escribirlo (ms). */
  wordDelayMs?: number;
  /** El asistente lo "escribe" con barrido al aparecer. */
  typewriter?: boolean;
  /** El médico lo detuvo a medio escribir (P-83). */
  stopped?: boolean;
  /** Si se detuvo, cuántas palabras alcanzaron a aparecer; el texto completo se conserva (P-96). */
  visibleWords?: number;
};

/** Una burbuja del guion de la bienvenida. */
export type WelcomeBubble = {
  text: (name: string) => string;
  /** Cuánto "piensa" antes de escribir esta burbuja (ms). */
  thinkingMs: number;
  /** Espera media entre palabras al escribir (ms). */
  wordDelayMs: number;
};

/** Un paso de la bienvenida: una o varias burbujas seguidas y el botón que aparece al final. */
export type WelcomeStep = {
  action: string;
  /** Acción secundaria junto a la principal (p. ej. "Nuevo paciente" en el último paso, ESP-004). */
  secondaryAction?: string;
  bubbles: readonly WelcomeBubble[];
};

/** Posición en el guion: paso y burbuja dentro del paso. */
export type TourPosition = { step: number; bubble: number };

/** Variante de la portada del chat vacío. */
export type ChatIntroMode = 'welcome' | 'patient';
