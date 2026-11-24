'use client';

import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { CircleAlert, Hash, UserPlus, X } from 'lucide-react';
import { ageFromBirthDate, toIsoDate, validateNewPatient, type NewPatientFieldErrors } from '@/lib/newPatient';
import {
  EMPTY_NON_PATHOLOGICAL_HISTORY,
  NON_PATHOLOGICAL_QUESTIONS,
  PATIENT_LIMITS,
  SEX_OPTIONS,
  type NewPatient,
  type NonPathologicalHistory,
  type NonPathologicalKey,
} from '@/types/patient';

type NewPatientDialogProps = {
  open: boolean;
  onClose: () => void;
  /**
   * Se llama con el alta ya validada; HomeScreen la guarda y selecciona al paciente.
   * @post Resuelve null si se registró, o el mensaje de error para mostrarlo en la ventana.
   */
  onCreate: (data: NewPatient) => Promise<string | null>;
};

const FOCUS_RING = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#116ee6]/60';
const FIELD =
  'w-full rounded-lg border-2 bg-white px-3 py-2.5 text-base text-slate-900 transition-colors hover:border-slate-300 focus:outline-none';

/**
 * Ventana para registrar un paciente nuevo (ESP-004). Pide nombre completo, sexo y fecha de nacimiento
 * (tabla PACIENTES; la edad se calcula de la fecha)
 * y los antecedentes no patológicos como casillas sí/no (IO_AntecNoPatolPacientes). El ID se asigna
 * solo, y el resto del expediente se captura en el chat.
 * Usa <dialog> nativo, como el buscador: atrapa el foco, se cierra con Escape y el fondo queda inerte.
 */
export default function NewPatientDialog({ open, onClose, onCreate }: NewPatientDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      dialog.querySelector<HTMLInputElement>('[data-autofocus]')?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
    // Al desmontarse u ocultarse la pantalla (Next conserva /home oculta al navegar), el diálogo
    // se cierra: un <dialog> modal abierto vuelve inerte toda la página nueva (P-107).
    return () => {
      if (dialog.open) dialog.close();
    };
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        // Clic en el fondo oscuro (fuera del panel): cierra.
        if (event.target === event.currentTarget) onClose();
      }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[min(32rem,calc(100vw-2rem))] max-w-none overflow-y-auto rounded-2xl border-2 border-slate-200 bg-white p-0 text-base text-slate-900 transition-[opacity,transform] duration-200 ease-out backdrop:bg-slate-950/50 starting:scale-[0.98] starting:opacity-0 motion-reduce:transition-none"
    >
      {/* El formulario se monta solo al abrir: así cada alta empieza limpia. */}
      {open && <NewPatientForm titleId={titleId} onClose={onClose} onCreate={onCreate} />}
    </dialog>
  );
}

function NewPatientForm({ titleId, onClose, onCreate }: Omit<NewPatientDialogProps, 'open'> & { titleId: string }) {
  const ids = useId();
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [sex, setSex] = useState('');
  const [history, setHistory] = useState<NonPathologicalHistory>(EMPTY_NON_PATHOLOGICAL_HISTORY);
  const [errors, setErrors] = useState<NewPatientFieldErrors>({});
  // Guardando en el servidor; y el error del servidor, si lo hubo (P-102).
  const [isSaving, setIsSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const birthDateRef = useRef<HTMLInputElement>(null);
  const sexRef = useRef<HTMLInputElement>(null);
  // Hoy y el límite de edad, para acotar el calendario y mostrar la edad calculada.
  const today = toIsoDate(new Date());
  const oldest = new Date();
  oldest.setFullYear(oldest.getFullYear() - PATIENT_LIMITS.ageMax - 1);
  oldest.setDate(oldest.getDate() + 1);
  const minBirthDate = toIsoDate(oldest);
  const age = birthDate ? ageFromBirthDate(birthDate, today) : null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving) return;
    setServerError(null);
    const result = validateNewPatient({ fullName, birthDate, sex, history }, today);
    if (!result.ok) {
      setErrors(result.errors);
      // El foco va al primer campo con error, para corregirlo de inmediato.
      (result.errors.fullName ? nameRef : result.errors.sex ? sexRef : birthDateRef).current?.focus();
      return;
    }
    setIsSaving(true);
    const error = await onCreate(result.data);
    // Si se registró, la ventana se cierra y este formulario se desmonta.
    if (error) {
      setServerError(error);
      setIsSaving(false);
    }
  };

  // Al corregir un campo, su error desaparece.
  const clearError = (field: keyof NewPatientFieldErrors) =>
    setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));

  const toggleHistory = (key: NonPathologicalKey) =>
    setHistory((current) => ({ ...current, [key]: !current[key] }));

  const fieldBorder = (hasError: boolean) =>
    hasError ? 'border-red-600 focus:border-red-600' : 'border-slate-200 focus:border-[#116ee6]';

  return (
    <form noValidate onSubmit={handleSubmit}>
      <header className="flex items-center gap-4 border-b-2 border-slate-200 px-6 pt-5 pb-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-800">
          <UserPlus aria-hidden="true" className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id={titleId} className="text-xl font-semibold text-slate-900">
            Nuevo paciente
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className={`rounded-lg p-2 text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-800 ${FOCUS_RING}`}
        >
          <X aria-hidden="true" className="h-5 w-5" />
        </button>
      </header>

      <div className="space-y-5 px-6 py-5">
        <div>
          <label htmlFor={`${ids}-name`} className="mb-1.5 block font-medium text-slate-700">
            Nombre completo
          </label>
          <input
            id={`${ids}-name`}
            ref={nameRef}
            data-autofocus
            type="text"
            autoComplete="off"
            maxLength={PATIENT_LIMITS.nameMax}
            value={fullName}
            onChange={(event) => {
              setFullName(event.target.value);
              clearError('fullName');
            }}
            aria-invalid={errors.fullName ? true : undefined}
            aria-describedby={errors.fullName ? `${ids}-name-error` : undefined}
            placeholder="Nombre(s) y apellidos"
            className={`${FIELD} ${fieldBorder(Boolean(errors.fullName))}`}
          />
          {errors.fullName && <FieldError id={`${ids}-name-error`} message={errors.fullName} />}
        </div>

        <fieldset aria-describedby={errors.sex ? `${ids}-sex-error` : undefined}>
          <legend className="mb-1.5 font-medium text-slate-700">Sexo</legend>
          <div className="flex flex-wrap gap-2">
            {SEX_OPTIONS.map(({ value, label }, index) => (
              <label
                key={value}
                className={`flex min-h-11 cursor-pointer items-center gap-2.5 rounded-lg border-2 px-4 py-2 transition-colors hover:border-slate-300 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#116ee6]/60 ${
                  sex === value ? 'border-teal-700 bg-teal-50 text-slate-900' : errors.sex ? 'border-red-600' : 'border-slate-200 text-slate-800'
                }`}
              >
                <input
                  ref={index === 0 ? sexRef : undefined}
                  type="radio"
                  name={`${ids}-sex`}
                  value={value}
                  checked={sex === value}
                  onChange={() => {
                    setSex(value);
                    clearError('sex');
                  }}
                  className="h-5 w-5 shrink-0 cursor-pointer accent-teal-700 focus:outline-none"
                />
                {label}
              </label>
            ))}
          </div>
          {errors.sex && <FieldError id={`${ids}-sex-error`} message={errors.sex} />}
        </fieldset>

        <div>
          <label htmlFor={`${ids}-birth-date`} className="mb-1.5 block font-medium text-slate-700">
            Fecha de nacimiento
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <input
              id={`${ids}-birth-date`}
              ref={birthDateRef}
              type="date"
              min={minBirthDate}
              max={today}
              value={birthDate}
              onChange={(event) => {
                setBirthDate(event.target.value);
                clearError('birthDate');
              }}
              aria-invalid={errors.birthDate ? true : undefined}
              aria-describedby={[`${ids}-age`, errors.birthDate ? `${ids}-birth-date-error` : ''].join(' ').trim()}
              className={`${FIELD} w-auto ${fieldBorder(Boolean(errors.birthDate))}`}
            />
            {/* Edad calculada, para que el médico confirme la fecha de un vistazo. */}
            <span id={`${ids}-age`} aria-live="polite" className="text-slate-700">
              {age !== null && age >= 0 ? `${age} ${age === 1 ? 'año' : 'años'}` : ''}
            </span>
          </div>
          {errors.birthDate && <FieldError id={`${ids}-birth-date-error`} message={errors.birthDate} />}
        </div>

        <fieldset>
          <legend className="mb-1 font-medium text-slate-700">Antecedentes no patológicos</legend>
          <p id={`${ids}-history-hint`} className="mb-2 text-sm text-slate-700">
            Marca las que apliquen; sin marcar cuenta como &ldquo;no&rdquo;.
          </p>
          <ul aria-describedby={`${ids}-history-hint`} className="grid gap-1 sm:grid-cols-2">
            {NON_PATHOLOGICAL_QUESTIONS.map(({ key, label }) => (
              <li key={key}>
                <label
                  className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-50 ${
                    history[key] ? 'text-slate-900' : 'text-slate-800'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={history[key]}
                    onChange={() => toggleHistory(key)}
                    className="h-5 w-5 shrink-0 cursor-pointer rounded accent-teal-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#116ee6]/60"
                  />
                  <span className="leading-snug">{label}</span>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>

        {serverError && (
          <p role="alert" className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-red-800">
            <CircleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
            {serverError}
          </p>
        )}

        <p className="flex items-start gap-2 rounded-lg bg-slate-100 px-3 py-2.5 text-slate-800">
          <Hash aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-slate-700" />
          El número de expediente se asigna automáticamente. Síntomas, signos y el resto de los antecedentes se
          capturan después, en el chat.
        </p>
      </div>

      <footer className="flex flex-wrap items-center justify-end gap-3 border-t-2 border-slate-200 px-6 py-3">
        <button
          type="button"
          onClick={onClose}
          className={`rounded-lg px-4 py-2 font-medium text-slate-800 transition-colors hover:bg-slate-100 ${FOCUS_RING}`}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSaving}
          aria-busy={isSaving}
          className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 font-semibold text-white transition-colors hover:bg-teal-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70"
        >
          <UserPlus aria-hidden="true" className="h-4 w-4" />
          {isSaving ? 'Registrando…' : 'Registrar y comenzar'}
        </button>
      </footer>
    </form>
  );
}

function FieldError({ id, message }: { id: string; message: string }) {
  return (
    <p id={id} className="mt-1.5 flex items-start gap-1.5 text-sm text-red-700">
      <CircleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
      {message}
    </p>
  );
}
