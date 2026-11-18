import type { LoginField } from '@/types/auth';

/**
 * Patrón Estado (GoF, de comportamiento).
 *
 * El formulario de inicio de sesión pasa por cuatro momentos: captura de datos (Idle),
 * espera de respuesta (Submitting), resultado correcto (Success) y error (Error).
 * Cada momento es una clase que decide qué mostrar (carga, mensajes, campos inválidos) y
 * cómo reaccionar a cada evento (enviar, fallar, tener éxito, editar). El componente
 * LoginForm (el "contexto") solo guarda el estado actual y le delega los eventos, en lugar
 * de combinar varias banderas booleanas con condicionales.
 *
 * Una transición que no tiene sentido en un estado devuelve el mismo estado. Por ejemplo,
 * submit() mientras se espera la respuesta no hace nada, lo que evita envíos duplicados.
 *
 * @inv isLoading == true si y solo si kind == 'submitting'.
 * @inv errorMessage y successMessage nunca tienen valor al mismo tiempo.
 * @inv invalidFields solo tiene elementos cuando kind == 'error'.
 * @inv Los estados son inmutables: cada transición devuelve un estado, nunca modifica el actual.
 */
export interface LoginState {
  readonly kind: 'idle' | 'submitting' | 'success' | 'error';
  readonly isLoading: boolean;
  readonly canSubmit: boolean;
  readonly errorMessage: string | null;
  readonly successMessage: string | null;
  readonly invalidFields: readonly LoginField[];

  /**
   * @pre canSubmit (si no se cumple, devuelve el mismo estado).
   * @post kind == 'submitting'.
   */
  submit(): LoginState;

  /**
   * @pre message no está vacío.
   * @post kind == 'error', errorMessage == message e invalidFields == fields.
   */
  fail(message: string, fields?: readonly LoginField[]): LoginState;

  /**
   * @pre kind == 'submitting' (si no, devuelve el mismo estado).
   * @post kind == 'success' y successMessage == message.
   */
  succeed(message: string): LoginState;

  /**
   * El usuario modificó un campo o cambió de modo.
   * @post Si había un mensaje de error o éxito, kind == 'idle'; mientras se espera la respuesta no cambia.
   */
  edit(): LoginState;
}

const NO_FIELDS: readonly LoginField[] = Object.freeze([]);

abstract class BaseLoginState implements LoginState {
  abstract readonly kind: LoginState['kind'];
  readonly isLoading: boolean = false;
  readonly canSubmit: boolean = true;
  readonly errorMessage: string | null = null;
  readonly successMessage: string | null = null;
  readonly invalidFields: readonly LoginField[] = NO_FIELDS;

  submit(): LoginState {
    return SUBMITTING;
  }

  fail(message: string, fields: readonly LoginField[] = NO_FIELDS): LoginState {
    return new ErrorState(message, fields);
  }

  succeed(message: string): LoginState {
    void message;
    return this;
  }

  edit(): LoginState {
    return IDLE;
  }
}

class IdleState extends BaseLoginState {
  readonly kind = 'idle' as const;
}

class SubmittingState extends BaseLoginState {
  readonly kind = 'submitting' as const;
  override readonly isLoading = true;
  override readonly canSubmit = false;

  override submit(): LoginState {
    return this;
  }

  override succeed(message: string): LoginState {
    return new SuccessState(message);
  }

  override edit(): LoginState {
    return this;
  }
}

class SuccessState extends BaseLoginState {
  readonly kind = 'success' as const;

  constructor(override readonly successMessage: string) {
    super();
  }
}

class ErrorState extends BaseLoginState {
  readonly kind = 'error' as const;

  constructor(
    override readonly errorMessage: string,
    override readonly invalidFields: readonly LoginField[],
  ) {
    super();
  }
}

const IDLE: LoginState = new IdleState();
const SUBMITTING: LoginState = new SubmittingState();

/** Estado inicial del formulario: captura de datos sin mensajes. */
export const initialLoginState: LoginState = IDLE;
