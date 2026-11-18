'use client';

import { useId, useState, type FormEvent } from 'react';
import { KeyRound } from 'lucide-react';
import AdminDialog, { DialogError, DialogFooter, TextField } from './AdminDialog';
import { validateNewPassword, type PasswordFieldErrors } from '@/lib/doctorValidation';
import { DOCTOR_LIMITS } from '@/types/doctor';
import { LOGIN_LIMITS } from '@/types/auth';

type PasswordDialogProps = {
  open: boolean;
  title: string;
  description: string;
  /** true para el cambio de la contraseña propia: pide también la actual. */
  requireCurrent?: boolean;
  onClose: () => void;
  /** @post Resuelve null si se guardó, o el mensaje de error para mostrarlo en la ventana. */
  onSubmit: (password: string, currentPassword: string) => Promise<string | null>;
};

type Errors = PasswordFieldErrors & { current?: string };

/**
 * Asigna una contraseña nueva: la de un médico (el administrador no necesita la anterior) o la propia
 * (pide la actual). La contraseña viaja al backend, que la guarda cifrada con BCrypt (ESP-007).
 */
export default function PasswordDialog(props: PasswordDialogProps) {
  return (
    <AdminDialog open={props.open} onClose={props.onClose} icon={KeyRound} title={props.title} description={props.description}>
      <PasswordForm {...props} />
    </AdminDialog>
  );
}

function PasswordForm({ requireCurrent = false, onClose, onSubmit }: PasswordDialogProps) {
  const ids = useId();
  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const clear = (field: keyof Errors) => {
    setErrors((existing) => (existing[field] ? { ...existing, [field]: undefined } : existing));
    setServerError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving) return;

    const found: Errors = {};
    if (requireCurrent && current.length === 0) found.current = 'Escribe tu contraseña actual.';
    const validation = validateNewPassword(password, confirmPassword);
    if (!validation.ok) Object.assign(found, validation.errors);

    const first = (['current', 'password', 'confirmPassword'] as const).find((field) => found[field]);
    if (first) {
      setErrors(found);
      document.getElementById(`${ids}-${first}`)?.focus();
      return;
    }

    setIsSaving(true);
    const error = await onSubmit(password, current);
    if (error) {
      setIsSaving(false);
      setServerError(error);
    }
  };

  return (
    <form noValidate onSubmit={handleSubmit} aria-busy={isSaving}>
      <fieldset disabled={isSaving} className="space-y-5 px-6 py-5">
        <legend className="sr-only">Contraseña nueva</legend>
        {requireCurrent && (
          <TextField
            id={`${ids}-current`}
            label="Contraseña actual"
            type="password"
            value={current}
            error={errors.current}
            maxLength={LOGIN_LIMITS.maxPasswordLength}
            autoComplete="current-password"
            autoFocus
            onChange={(value) => {
              setCurrent(value);
              clear('current');
            }}
          />
        )}
        <TextField
          id={`${ids}-password`}
          label="Contraseña nueva"
          hint={`De ${DOCTOR_LIMITS.passwordMin} a ${DOCTOR_LIMITS.passwordMax} caracteres.`}
          type="password"
          value={password}
          error={errors.password}
          maxLength={DOCTOR_LIMITS.passwordMax}
          autoComplete="new-password"
          autoFocus={!requireCurrent}
          onChange={(value) => {
            setPassword(value);
            clear('password');
          }}
        />
        <TextField
          id={`${ids}-confirmPassword`}
          label="Confirmar contraseña nueva"
          type="password"
          value={confirmPassword}
          error={errors.confirmPassword}
          maxLength={DOCTOR_LIMITS.passwordMax}
          autoComplete="new-password"
          onChange={(value) => {
            setConfirmPassword(value);
            clear('confirmPassword');
          }}
        />
        <DialogError message={serverError} />
      </fieldset>
      <DialogFooter onCancel={onClose} isSaving={isSaving} submitLabel="Guardar contraseña" savingLabel="Guardando…" />
    </form>
  );
}
