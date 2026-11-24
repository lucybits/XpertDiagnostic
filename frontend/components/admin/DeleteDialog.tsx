'use client';

import { useState, type FormEvent, type ReactNode } from 'react';
import { Trash2 } from 'lucide-react';
import AdminDialog, { DialogError, DialogFooter } from './AdminDialog';

type DeleteDialogProps = {
  open: boolean;
  title: string;
  /** Qué se va a eliminar, por ejemplo "¿Eliminar a Ana López (ID 500)?". */
  question: ReactNode;
  /** Qué se pierde al eliminar. */
  consequence: ReactNode;
  confirmLabel: string;
  onClose: () => void;
  /** @post Resuelve null si se eliminó, o el mensaje de error para mostrarlo sin cerrar. */
  onConfirm: () => Promise<string | null>;
};

/**
 * Confirma un borrado definitivo desde el panel de administración (P-144): médicos y pacientes.
 * No se puede deshacer, así que la ventana lo dice y el botón usa el tono de peligro.
 */
export default function DeleteDialog({ open, title, onClose, ...form }: DeleteDialogProps) {
  return (
    <AdminDialog open={open} onClose={onClose} icon={Trash2} tone="danger" title={title}>
      {open && <DeleteForm onClose={onClose} {...form} />}
    </AdminDialog>
  );
}

function DeleteForm({
  question,
  consequence,
  confirmLabel,
  onClose,
  onConfirm,
}: Omit<DeleteDialogProps, 'open' | 'title'>) {
  const [isSaving, setIsSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    const error = await onConfirm();
    // Si se eliminó, la ventana se cierra y este formulario se desmonta.
    if (error) {
      setIsSaving(false);
      setServerError(error);
    }
  };

  return (
    <form noValidate onSubmit={handleSubmit} aria-busy={isSaving}>
      <div className="space-y-4 px-6 py-5">
        <p>{question}</p>
        <p className="rounded-lg bg-red-50 px-3 py-2.5 text-red-900">
          {consequence} <strong className="font-semibold">Esta acción no se puede deshacer.</strong>
        </p>
        <DialogError message={serverError} />
      </div>
      <DialogFooter
        onCancel={onClose}
        isSaving={isSaving}
        tone="danger"
        submitLabel={confirmLabel}
        savingLabel="Eliminando…"
      />
    </form>
  );
}
