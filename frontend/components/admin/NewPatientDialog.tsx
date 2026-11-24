'use client';

import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { CircleAlert, Hash, UserPlus, X } from 'lucide-react';
import { oldestBirthDateIso, todayIso, validateNewPatient, type NewPatientFieldErrors, type NewPatientInput } from '@/lib/newPatient';
import { PATIENT_LIMITS, SEX_OPTIONS, type NewPatient, type NewPatientField } from '@/types/patient';

type NewPatientDialogProps = {
  open: boolean;
  onClose: () => void;
  /**
   * Se llama con el alta ya validada; el panel de administración la guarda y actualiza la lista.
   * @post Resuelve null si se registró, o el mensaje de error para mostrarlo en la ventana.
   */
  onCreate: (data: NewPatient) => Promise<string | null>;
};

const FOCUS_RING = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#116ee6]/60';
const FIELD =
  'w-full rounded-lg border-2 bg-white px-3 py-2.5 text-base text-slate-900 transition-colors hover:border-slate-300 focus:outline-none';

// Orden del formulario: el foco va al primer campo con error.
const FIELD_ORDER: NewPatientField[] = ['givenNames', 'paternalSurname', 'maternalSurname', 'birthDate', 'sex'];

const EMPTY_FORM: NewPatientInput = { givenNames: '', paternalSurname: '', maternalSurname: '', birthDate: '', sex: '' };

/**
 * Ventana del administrador para registrar un paciente nuevo (ESP-004, P-144). Pide nombre(s), apellido
 * paterno, apellido materno (opcional), fecha de nacimiento y sexo. El ID se asigna solo y la edad se calcula
 * de la fecha; el resto del expediente lo captura después el médico tratante.
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
    // Al desmontarse u ocultarse la pantalla, el diálogo se cierra: un <dialog> modal abierto vuelve
    // inerte toda la página nueva (P-107).
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
      className="m-auto max-h-[calc(100dvh-2rem)] w-[min(36rem,calc(100vw-2rem))] max-w-none overflow-y-auto rounded-2xl border-2 border-slate-200 bg-white p-0 text-base text-slate-900 transition-[opacity,transform] duration-200 ease-out backdrop:bg-slate-950/50 starting:scale-[0.98] starting:opacity-0 motion-reduce:transition-none"
    >
      {/* El formulario se monta solo al abrir: así cada alta empieza limpia. */}
      {open && <NewPatientForm titleId={titleId} onClose={onClose} onCreate={onCreate} />}
    </dialog>
  );
}

function NewPatientForm({ titleId, onClose, onCreate }: Omit<NewPatientDialogProps, 'open'> & { titleId: string }) {
  const ids = useId();
  const [form, setForm] = useState<NewPatientInput>(EMPTY_FORM);
  const [errors, setErrors] = useState<NewPatientFieldErrors>({});
  // Guardando en el servidor; y el error del servidor, si lo hubo (P-102).
  const [isSaving, setIsSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const fieldId = (field: NewPatientField) => `${ids}-${field}`;

  const update = (field: NewPatientField, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    // Al corregir un campo, su error desaparece.
    setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving) return;
    setServerError(null);
    const result = validateNewPatient(form);
    if (!result.ok) {
      setErrors(result.errors);
      // El foco va al primer campo con error, para corregirlo de inmediato.
      const first = FIELD_ORDER.find((field) => result.errors[field]);
      if (first) document.getElementById(fieldId(first))?.focus();
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

  const fieldBorder = (hasError: boolean) =>
    hasError ? 'border-red-600 focus:border-red-600' : 'border-slate-200 focus:border-[#116ee6]';

  const textField = (field: NewPatientField, label: string, maxLength: number, options: { optional?: boolean; autoFocus?: boolean; className?: string } = {}) => (
    <div className={options.className}>
      <label htmlFor={fieldId(field)} className="mb-1.5 block font-medium text-slate-700">
        {label}
        {options.optional && <span className="font-normal text-slate-600"> (opcional)</span>}
      </label>
      <input
        id={fieldId(field)}
        data-autofocus={options.autoFocus ? true : undefined}
        type="text"
        autoComplete="off"
        maxLength={maxLength}
        value={form[field]}
        onChange={(event) => update(field, event.target.value)}
        aria-invalid={errors[field] ? true : undefined}
        aria-describedby={errors[field] ? `${fieldId(field)}-error` : undefined}
        className={`${FIELD} ${fieldBorder(Boolean(errors[field]))}`}
      />
      {errors[field] && <FieldError id={`${fieldId(field)}-error`} message={errors[field]} />}
    </div>
  );

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

      <fieldset disabled={isSaving} className="grid gap-5 px-6 py-5 sm:grid-cols-2">
        <legend className="sr-only">Datos del paciente</legend>
        {textField('givenNames', 'Nombre(s)', PATIENT_LIMITS.givenNamesMax, { autoFocus: true, className: 'sm:col-span-2' })}
        {textField('paternalSurname', 'Apellido paterno', PATIENT_LIMITS.surnameMax)}
        {textField('maternalSurname', 'Apellido materno', PATIENT_LIMITS.surnameMax, { optional: true })}

        <div>
          <label htmlFor={fieldId('birthDate')} className="mb-1.5 block font-medium text-slate-700">
            Fecha de nacimiento
          </label>
          <input
            id={fieldId('birthDate')}
            type="date"
            min={oldestBirthDateIso()}
            max={todayIso()}
            value={form.birthDate}
            onChange={(event) => update('birthDate', event.target.value)}
            aria-invalid={errors.birthDate ? true : undefined}
            aria-describedby={errors.birthDate ? `${fieldId('birthDate')}-error` : undefined}
            className={`${FIELD} ${fieldBorder(Boolean(errors.birthDate))}`}
          />
          {errors.birthDate && <FieldError id={`${fieldId('birthDate')}-error`} message={errors.birthDate} />}
        </div>

        <div role="radiogroup" aria-labelledby={`${fieldId('sex')}-label`} aria-describedby={errors.sex ? `${fieldId('sex')}-error` : undefined}>
          <span id={`${fieldId('sex')}-label`} className="mb-1.5 block font-medium text-slate-700">
            Sexo
          </span>
          <div className="flex flex-wrap gap-2">
            {SEX_OPTIONS.map(({ value, label }, index) => (
              <label
                key={value}
                className={`flex min-h-11 cursor-pointer items-center gap-2.5 rounded-lg border-2 px-4 py-2 transition-colors hover:border-slate-300 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#116ee6]/60 ${
                  form.sex === value ? 'border-teal-700 bg-teal-50 text-slate-900' : errors.sex ? 'border-red-600' : 'border-slate-200 text-slate-800'
                }`}
              >
                <input
                  id={index === 0 ? fieldId('sex') : undefined}
                  type="radio"
                  name={fieldId('sex')}
                  value={value}
                  checked={form.sex === value}
                  onChange={() => update('sex', value)}
                  className="h-5 w-5 shrink-0 cursor-pointer accent-teal-700 focus:outline-none"
                />
                {label}
              </label>
            ))}
          </div>
          {errors.sex && <FieldError id={`${fieldId('sex')}-error`} message={errors.sex} />}
        </div>

        {serverError && (
          <p role="alert" className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-red-800 sm:col-span-2">
            <CircleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
            {serverError}
          </p>
        )}

        <p className="flex items-start gap-2 rounded-lg bg-slate-100 px-3 py-2.5 text-slate-800 sm:col-span-2">
          <Hash aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-slate-700" />
          El número de expediente se asigna automáticamente y la edad se calcula con la fecha de nacimiento.
          Antecedentes, síntomas, signos y estudios los captura después el médico tratante.
        </p>
      </fieldset>

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
          {isSaving ? 'Registrando…' : 'Registrar paciente'}
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
