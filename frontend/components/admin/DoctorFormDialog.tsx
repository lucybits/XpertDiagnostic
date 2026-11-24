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
import {
  DOCTOR_LIMITS,
  DOCTOR_ROLE_OPTIONS,
  USER_ROLES,
  type DoctorRegistration,
  type DoctorRegistrationField,
  type DoctorUpdate,
} from '@/types/doctor';

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
  'rol',
  'idMedico',
  'cedulaProfesional',
  'nombreCompleto',
  'especialidad',
  'password',
  'confirmPassword',
];

/**
 * Alta (cuenta nueva de médico con contraseña inicial) o edición (tipo, nombre, especialidad y cédula)
 * de un médico desde el panel de administración (ESP-007). El tipo (tratante o internista) decide la
 * pantalla a la que entra el médico (P-144). Valida con las mismas reglas que el backend.
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
    rol: editing?.rol ?? USER_ROLES.doctor,
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
        <fieldset className="sm:col-span-2" aria-describedby={errors.rol ? `${fieldId('rol')}-error` : undefined}>
          <legend className="mb-1 text-sm font-medium text-slate-800">Tipo de médico</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {DOCTOR_ROLE_OPTIONS.map((option, index) => {
              const checked = form.rol === option.value;
              return (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-md border-2 px-3 py-2.5 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#116ee6]/60 ${
                    checked ? 'border-blue-900 bg-blue-50' : 'border-slate-300 hover:border-slate-400'
                  }`}
                >
                  <input
                    id={index === 0 ? fieldId('rol') : undefined}
                    type="radio"
                    name={`${ids}-rol`}
                    value={option.value}
                    checked={checked}
                    onChange={() => update('rol', option.value)}
                    className="mt-1 h-4 w-4 accent-blue-900"
                  />
                  <span>
                    <span className="block font-medium text-slate-900">{option.label}</span>
                    <span className="block text-sm text-slate-700">{option.hint}</span>
                  </span>
                </label>
              );
            })}
          </div>
          {errors.rol && (
            <p id={`${fieldId('rol')}-error`} className="mt-1 text-sm text-red-700">
              {errors.rol}
            </p>
          )}
          {!isCreate && editing && form.rol !== editing.rol && (
            <p className="mt-2 text-sm text-slate-700">
              Al cambiar el tipo, se cerrarán las sesiones abiertas del médico y entrará a la pantalla de su nuevo tipo.
            </p>
          )}
        </fieldset>
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
