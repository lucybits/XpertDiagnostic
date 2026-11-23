'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { CircleAlert, X, type LucideIcon } from 'lucide-react';
import LoadingDots from '@/components/ui/LoadingDots';

export const FOCUS_RING = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#116ee6]/60';
const FIELD =
  'w-full rounded-lg border-2 bg-white px-3 py-2.5 text-base text-slate-900 transition-colors placeholder:text-slate-500 hover:border-slate-300 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500';

type AdminDialogProps = {
  open: boolean;
  title: string;
  description?: ReactNode;
  icon: LucideIcon;
  /** Tono del ícono: 'danger' para acciones que quitan acceso. */
  tone?: 'default' | 'danger';
  onClose: () => void;
  /** Contenido del formulario; se monta solo con la ventana abierta, así cada apertura empieza limpia. */
  children: ReactNode;
};

/**
 * Ventana modal del panel de administración. Usa <dialog> nativo, como NewPatientDialog: atrapa el
 * foco, se cierra con Escape o clic en el fondo y deja inerte el resto de la página.
 */
export default function AdminDialog({ open, title, description, icon: Icon, tone = 'default', onClose, children }: AdminDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
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
        if (event.target === event.currentTarget) onClose();
      }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[min(36rem,calc(100vw-2rem))] max-w-none overflow-y-auto rounded-2xl border-2 border-slate-200 bg-white p-0 text-base text-slate-900 transition-[opacity,transform] duration-200 ease-out backdrop:bg-slate-950/50 starting:scale-[0.98] starting:opacity-0 motion-reduce:transition-none"
    >
      {open && (
        <>
          <header className="flex items-start gap-4 border-b-2 border-slate-200 px-6 pt-5 pb-4">
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                tone === 'danger' ? 'bg-red-100 text-red-800' : 'bg-teal-100 text-teal-800'
              }`}
            >
              <Icon aria-hidden="true" className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 id={titleId} className="text-xl font-semibold text-slate-900">
                {title}
              </h2>
              {description && <p className="mt-0.5 text-slate-700">{description}</p>}
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
          {children}
        </>
      )}
    </dialog>
  );
}

/** Pie con Cancelar y el botón principal; muestra la animación de carga mientras se guarda. */
export function DialogFooter({
  onCancel,
  isSaving,
  submitLabel,
  savingLabel,
  tone = 'default',
}: {
  onCancel: () => void;
  isSaving: boolean;
  submitLabel: string;
  savingLabel: string;
  tone?: 'default' | 'danger';
}) {
  return (
    <footer className="flex flex-wrap items-center justify-end gap-3 border-t-2 border-slate-200 px-6 py-3">
      <button
        type="button"
        onClick={onCancel}
        className={`rounded-lg px-4 py-2.5 font-medium text-slate-800 transition-colors hover:bg-slate-100 ${FOCUS_RING}`}
      >
        Cancelar
      </button>
      <button
        type="submit"
        disabled={isSaving}
        className={`flex min-w-40 items-center justify-center gap-2 rounded-lg px-5 py-2.5 font-medium text-white transition-colors disabled:cursor-wait disabled:opacity-80 ${FOCUS_RING} focus-visible:ring-offset-2 ${
          tone === 'danger' ? 'bg-red-700 hover:bg-red-800' : 'bg-[#0b1533] hover:bg-[#1a2650]'
        }`}
      >
        {isSaving ? (
          <>
            <LoadingDots className="h-6 w-6" label={null} />
            {savingLabel}
          </>
        ) : (
          submitLabel
        )}
      </button>
    </footer>
  );
}

/** Mensaje de error del servidor dentro de una ventana. */
export function DialogError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-red-800">
      <CircleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
      {message}
    </p>
  );
}

type TextFieldProps = {
  id: string;
  label: string;
  hint?: string;
  value: string;
  error?: string;
  type?: 'text' | 'password';
  inputMode?: 'numeric' | 'text';
  maxLength?: number;
  autoComplete: string;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
  onChange: (value: string) => void;
};

/** Campo de texto con etiqueta, ayuda y error enlazados por aria-describedby. */
export function TextField({
  id,
  label,
  hint,
  value,
  error,
  type = 'text',
  inputMode,
  maxLength,
  autoComplete,
  disabled = false,
  autoFocus = false,
  className = '',
  onChange,
}: TextFieldProps) {
  const describedBy = [hint && !error ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(' ');

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block font-medium text-slate-700">
        {label}
      </label>
      <input
        id={id}
        type={type}
        inputMode={inputMode}
        maxLength={maxLength}
        autoComplete={autoComplete}
        value={value}
        disabled={disabled}
        data-autofocus={autoFocus ? true : undefined}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={`${FIELD} ${error ? 'border-red-600 focus:border-red-600' : 'border-slate-200 focus:border-[#116ee6]'}`}
      />
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-sm text-slate-700">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
