'use client';

import { useState, type FormEvent } from 'react';
import { UserRoundCheck, UserRoundX } from 'lucide-react';
import AdminDialog, { DialogError, DialogFooter } from './AdminDialog';
import type { DoctorAccount } from '@/types/admin';

type StatusDialogProps = {
  open: boolean;
  doctor: DoctorAccount | null;
  onClose: () => void;
  /** @post Resuelve null si se guardó, o el mensaje de error. */
  onConfirm: (doctor: DoctorAccount, activo: boolean) => Promise<string | null>;
};

/**
 * Confirma activar o desactivar la cuenta de un médico (ESP-007). Desactivar es una baja lógica:
 * no borra al médico ni sus datos; solo impide que entre y cierra sus sesiones abiertas.
 */
export default function StatusDialog({ open, doctor, onClose, onConfirm }: StatusDialogProps) {
  const deactivating = doctor?.activo ?? true;
  return (
    <AdminDialog
      open={open}
      onClose={onClose}
      icon={deactivating ? UserRoundX : UserRoundCheck}
      tone={deactivating ? 'danger' : 'default'}
      title={deactivating ? 'Desactivar cuenta' : 'Activar cuenta'}
    >
      {doctor && <StatusForm doctor={doctor} onClose={onClose} onConfirm={onConfirm} />}
    </AdminDialog>
  );
}

function StatusForm({
  doctor,
  onClose,
  onConfirm,
}: {
  doctor: DoctorAccount;
  onClose: () => void;
  onConfirm: StatusDialogProps['onConfirm'];
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const deactivating = doctor.activo;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    const error = await onConfirm(doctor, !doctor.activo);
    if (error) {
      setIsSaving(false);
      setServerError(error);
    }
  };

  return (
    <form noValidate onSubmit={handleSubmit} aria-busy={isSaving}>
      <div className="space-y-4 px-6 py-5">
        <p>
          {deactivating ? '¿Desactivar la cuenta de ' : '¿Activar de nuevo la cuenta de '}
          <strong className="font-semibold">{doctor.nombreCompleto}</strong> (ID {doctor.idMedico})?
        </p>
        <p className="rounded-lg bg-slate-100 px-3 py-2.5 text-slate-600">
          {deactivating
            ? 'No podrá iniciar sesión y, si tiene una sesión abierta, se cerrará. Sus datos se conservan y puedes volver a activarla cuando quieras.'
            : 'Podrá volver a iniciar sesión con su ID y su contraseña actual.'}
        </p>
        <DialogError message={serverError} />
      </div>
      <DialogFooter
        onCancel={onClose}
        isSaving={isSaving}
        tone={deactivating ? 'danger' : 'default'}
        submitLabel={deactivating ? 'Desactivar' : 'Activar'}
        savingLabel="Guardando…"
      />
    </form>
  );
}
