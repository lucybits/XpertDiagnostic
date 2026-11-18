'use client';

import { useId, useState, type FormEvent } from 'react';
import { UserRoundPen, UserRoundPlus } from 'lucide-react';
import AdminDialog, { DialogError, DialogFooter, TextField } from './AdminDialog';
import {
  validateDoctorRegistration,
  validateDoctorUpdate,
  type DoctorFieldErrors,
  type DoctorRegistrationInput,
} from '@/lib/doctorValidation';
import type { DoctorAccount } from '@/types/admin';
import { DOCTOR_LIMITS, type DoctorRegistration, type DoctorRegistrationField, type DoctorUpdate } from '@/types/doctor';

/** Resultado de guardar: null si se guardó; si no, el mensaje y, si aplica, el campo a corregir. */
export type SaveOutcome = null | { message: string; field?: DoctorRegistrationField };

type DoctorFormDialogProps =
  | { mode: 'create'; open: boolean; onClose: () => void; onSubmit: (data: DoctorRegistration) => Promise<SaveOutcome> }
  | {
      mode: 'edit';
      open: boolean;
      doctor: DoctorAccount | null;
      onClose: () => void;
      onSubmit: (data: DoctorUpdate) => Promise<SaveOutcome>;
    };

// Orden del formulario: el foco va al primer campo con error.
const FIELD_ORDER: DoctorRegistrationField[] = [
  'idMedico',
  'cedulaProfesional',
  'nombreCompleto',
  'especialidad',
  'password',
  'confirmPassword',
];

/**
 * Alta (cuenta nueva de médico con contraseña inicial) o edición (nombre, especialidad y cédula)
 * de un médico desde el panel de administración (ESP-007). Valida con las mismas reglas que el backend.
 */
export default function DoctorFormDialog(props: DoctorFormDialogProps) {
  const isCreate = props.mode === 'create';
  return (
    <AdminDialog
      open={props.open}
      onClose={props.onClose}
      icon={isCreate ? UserRoundPlus : UserRoundPen}
      title={isCreate ? 'Registrar médico' : 'Editar médico'}
      description={
        isCreate
          ? 'Se crea el registro del médico y su cuenta. Iniciará sesión en el apartado Médico con el ID y la contraseña que escribas.'
          : 'El ID no cambia: es el usuario con el que el médico inicia sesión.'
      }
    >
      <DoctorForm {...props} />
    </AdminDialog>
  );
}

function DoctorForm(props: DoctorFormDialogProps) {
  const ids = useId();
  const isCreate = props.mode === 'create';
  const editing = props.mode === 'edit' ? props.doctor : null;

  const [form, setForm] = useState<DoctorRegistrationInput>(() => ({
    idMedico: editing ? String(editing.idMedico) : '',
    nombreCompleto: editing?.nombreCompleto ?? '',
    especialidad: editing?.especialidad ?? '',
    cedulaProfesional: editing?.cedulaProfesional ?? '',
    password: '',
    confirmPassword: '',
  }));
  const [errors, setErrors] = useState<DoctorFieldErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const fieldId = (field: DoctorRegistrationField) => `${ids}-${field}`;
  const focusField = (field: DoctorRegistrationField) => document.getElementById(fieldId(field))?.focus();

  const update = (field: keyof DoctorRegistrationInput, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));
    setServerError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving) return;

    let outcome: SaveOutcome;
    if (props.mode === 'create') {
      const validation = validateDoctorRegistration(form);
      if (!validation.ok) return showErrors(validation.errors);
      setIsSaving(true);
      outcome = await props.onSubmit(validation.data);
    } else {
      const validation = validateDoctorUpdate(form);
      if (!validation.ok) return showErrors(validation.errors);
      setIsSaving(true);
      outcome = await props.onSubmit(validation.data);
    }

    // Si se guardó, la ventana se cierra y este formulario se desmonta.
    if (outcome) {
      setIsSaving(false);
      setServerError(outcome.message);
      if (outcome.field) {
        setErrors({ [outcome.field]: outcome.message });
        focusField(outcome.field);
      }
    }
  };

  const showErrors = (found: DoctorFieldErrors) => {
    setErrors(found);
    const first = FIELD_ORDER.find((field) => found[field]);
    if (first) focusField(first);
  };

  return (
    <form noValidate onSubmit={handleSubmit} aria-busy={isSaving}>
      <fieldset disabled={isSaving} className="grid gap-5 px-6 py-5 sm:grid-cols-2">
        <legend className="sr-only">Datos del médico</legend>
        <TextField
          id={fieldId('idMedico')}
          label="ID del médico"
          hint={isCreate ? 'Número con el que iniciará sesión.' : 'No se puede cambiar.'}
          value={form.idMedico}
          error={errors.idMedico}
          inputMode="numeric"
          maxLength={DOCTOR_LIMITS.maxIdDigits}
          autoComplete="off"
          disabled={!isCreate}
          autoFocus={isCreate}
          onChange={(value) => update('idMedico', value.replace(/\D/g, ''))}
        />
        <TextField
          id={fieldId('cedulaProfesional')}
          label="Cédula profesional"
          hint="7 u 8 dígitos."
          value={form.cedulaProfesional}
          error={errors.cedulaProfesional}
          inputMode="numeric"
          maxLength={8}
          autoComplete="off"
          onChange={(value) => update('cedulaProfesional', value.replace(/\D/g, ''))}
        />
        <TextField
          id={fieldId('nombreCompleto')}
          label="Nombre completo"
          value={form.nombreCompleto}
          error={errors.nombreCompleto}
          maxLength={DOCTOR_LIMITS.nameMax}
          autoComplete="off"
          autoFocus={!isCreate}
          className="sm:col-span-2"
          onChange={(value) => update('nombreCompleto', value)}
        />
        <TextField
          id={fieldId('especialidad')}
          label="Especialidad"
          value={form.especialidad}
          error={errors.especialidad}
          maxLength={DOCTOR_LIMITS.specialtyMax}
          autoComplete="off"
          className="sm:col-span-2"
          onChange={(value) => update('especialidad', value)}
        />
        {isCreate && (
          <>
            <TextField
              id={fieldId('password')}
              label="Contraseña inicial"
              hint={`De ${DOCTOR_LIMITS.passwordMin} a ${DOCTOR_LIMITS.passwordMax} caracteres.`}
              type="password"
              value={form.password}
              error={errors.password}
              maxLength={DOCTOR_LIMITS.passwordMax}
              autoComplete="new-password"
              onChange={(value) => update('password', value)}
            />
            <TextField
              id={fieldId('confirmPassword')}
              label="Confirmar contraseña"
              type="password"
              value={form.confirmPassword}
              error={errors.confirmPassword}
              maxLength={DOCTOR_LIMITS.passwordMax}
              autoComplete="new-password"
              onChange={(value) => update('confirmPassword', value)}
            />
          </>
        )}
        <div className="sm:col-span-2">
          <DialogError message={serverError} />
        </div>
      </fieldset>
      <DialogFooter
        onCancel={props.onClose}
        isSaving={isSaving}
        submitLabel={isCreate ? 'Registrar médico' : 'Guardar cambios'}
        savingLabel={isCreate ? 'Registrando…' : 'Guardando…'}
      />
    </form>
  );
}
