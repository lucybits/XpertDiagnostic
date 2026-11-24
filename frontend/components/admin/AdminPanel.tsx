'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { KeyRound, LogOut } from 'lucide-react';
import LoadingDots from '@/components/ui/LoadingDots';
import AdminPatientsSection from './AdminPatientsSection';
import DeleteDialog from './DeleteDialog';
import DoctorFormDialog, { type SaveOutcome } from './DoctorFormDialog';
import PasswordDialog from './PasswordDialog';
import StatusDialog from './StatusDialog';
import { FOCUS_RING } from './AdminDialog';
import {
  changeOwnPassword,
  createDoctor,
  deleteDoctor,
  listDoctors,
  resetDoctorPassword,
  setDoctorStatus,
  updateDoctor,
} from '@/services/adminService';
import { getSessionState, logoutAndGoToLogin } from '@/services/doctorService';
import type { AdminFailure, DoctorAccount } from '@/types/admin';
import { HOME_ROUTE_BY_ROLE } from '@/types/auth';
import { USER_ROLES, doctorRoleLabel, type SessionProfile } from '@/types/doctor';

const SEARCH_DELAY_MS = 250;

const FAILURE_MESSAGES: Record<AdminFailure, string> = {
  unauthenticated: 'Tu sesión terminó. Vuelve a iniciar sesión.',
  forbidden: 'Solo un administrador puede hacer esto.',
  'not-found': 'No se encontró al médico; quizá ya no existe. Actualiza la lista.',
  conflict: 'Ya existe un médico con esos datos.',
  'invalid-request': 'Revisa los datos: alguno no cumple las reglas.',
  unavailable: 'El servicio no está disponible en este momento. Inténtalo de nuevo.',
  network: 'No hay conexión con el servidor. Revisa tu red e inténtalo de nuevo.',
};

type DialogState =
  | { kind: 'create' }
  | { kind: 'edit'; doctor: DoctorAccount }
  | { kind: 'password'; doctor: DoctorAccount }
  | { kind: 'status'; doctor: DoctorAccount }
  | { kind: 'delete'; doctor: DoctorAccount }
  | { kind: 'own-password' }
  | null;

type ListState = { status: 'loading' } | { status: 'ready'; doctors: DoctorAccount[] } | { status: 'error'; message: string };

/** Secciones del panel (P-144): cuentas de médicos y alta/baja de pacientes. */
type Section = 'doctors' | 'patients';
const SECTIONS: readonly { id: Section; label: string }[] = [
  { id: 'doctors', label: 'Médicos' },
  { id: 'patients', label: 'Pacientes' },
];

const dateFormatter = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' });

/**
 * Panel de administración (ESP-007, P-144): alta, edición y baja de médicos (tratantes e internistas)
 * y alta y baja de pacientes. Toda la información viene de la base de datos a través del backend;
 * después de cada cambio se vuelve a leer la lista, así lo que se ve es siempre lo que quedó guardado.
 */
export default function AdminPanel() {
  const router = useRouter();
  const [section, setSection] = useState<Section>('doctors');
  const [profile, setProfile] = useState<SessionProfile | null>(null);
  const [list, setList] = useState<ListState>({ status: 'loading' });
  const [query, setQuery] = useState('');
  const [dialog, setDialog] = useState<DialogState>(null);
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const requestId = useRef(0);

  const endSession = useCallback(() => logoutAndGoToLogin(), []);

  /** Lee la lista de la base. Si llegan respuestas fuera de orden, solo cuenta la última pedida. */
  const loadDoctors = useCallback(
    async (search: string) => {
      const id = ++requestId.current;
      const result = await listDoctors(search);
      if (id !== requestId.current) return;
      if (result.ok) {
        setList({ status: 'ready', doctors: result.data });
      } else if (result.reason === 'unauthenticated') {
        void endSession();
      } else {
        setList({ status: 'error', message: FAILURE_MESSAGES[result.reason] });
      }
    },
    [endSession],
  );

  // Sesión: solo administradores. El proxy ya lo revisa; esto cubre sesiones que el backend invalidó.
  useEffect(() => {
    let isActive = true;
    getSessionState().then((state) => {
      if (!isActive) return;
      if (state.status === 'unauthenticated') {
        void endSession();
      } else if (state.status === 'ok' && state.profile.rol !== USER_ROLES.admin) {
        router.replace(HOME_ROUTE_BY_ROLE[state.profile.rol] ?? '/login');
      } else if (state.status === 'ok') {
        setProfile(state.profile);
      }
    });
    return () => {
      isActive = false;
    };
  }, [endSession, router]);

  // Búsqueda con una pequeña espera para no consultar en cada tecla.
  useEffect(() => {
    const timeout = setTimeout(() => void loadDoctors(query), query ? SEARCH_DELAY_MS : 0);
    return () => clearTimeout(timeout);
  }, [query, loadDoctors]);

  const closeDialog = () => setDialog(null);

  /** Convierte un fallo en mensaje; si la sesión terminó, cierra y vuelve al login. */
  const failureMessage = (reason: AdminFailure, message?: string) => {
    if (reason === 'unauthenticated') void endSession();
    return (reason === 'conflict' || reason === 'invalid-request') && message ? message : FAILURE_MESSAGES[reason];
  };

  const finish = (text: string) => {
    setDialog(null);
    setNotice({ tone: 'success', text });
    void loadDoctors(query);
  };

  const handleCreate = async (data: Parameters<typeof createDoctor>[0]): Promise<SaveOutcome> => {
    const result = await createDoctor(data);
    if (result.ok) {
      finish(
        `Se registró a ${result.data.nombreCompleto} como médico ${doctorRoleLabel(result.data.rol).toLowerCase()}. Ya puede iniciar sesión con el ID ${result.data.idMedico}.`,
      );
      return null;
    }
    const message = failureMessage(result.reason, result.message);
    if (result.reason === 'conflict') {
      return { message, field: message.includes('cédula') ? 'cedulaProfesional' : 'idMedico' };
    }
    return { message };
  };

  const handleUpdate = async (doctor: DoctorAccount, data: Parameters<typeof updateDoctor>[1]): Promise<SaveOutcome> => {
    const result = await updateDoctor(doctor.idMedico, data);
    if (result.ok) {
      finish(`Se guardaron los datos de ${result.data.nombreCompleto}.`);
      return null;
    }
    const message = failureMessage(result.reason, result.message);
    return result.reason === 'conflict' ? { message, field: 'cedulaProfesional' } : { message };
  };

  const handleResetPassword = async (doctor: DoctorAccount, password: string) => {
    const result = await resetDoctorPassword(doctor.idMedico, password);
    if (result.ok) {
      finish(`Se asignó una contraseña nueva a ${doctor.nombreCompleto}. Compártela con el médico por un medio seguro.`);
      return null;
    }
    return failureMessage(result.reason, result.message);
  };

  const handleStatus = async (doctor: DoctorAccount, activo: boolean) => {
    const result = await setDoctorStatus(doctor.idMedico, activo);
    if (result.ok) {
      finish(
        activo
          ? `La cuenta de ${doctor.nombreCompleto} está activa de nuevo.`
          : `La cuenta de ${doctor.nombreCompleto} quedó desactivada.`,
      );
      return null;
    }
    return failureMessage(result.reason, result.message);
  };

  const handleDelete = async (doctor: DoctorAccount) => {
    const result = await deleteDoctor(doctor.idMedico);
    if (result.ok) {
      finish(`Se eliminó a ${doctor.nombreCompleto} (ID ${doctor.idMedico}) y su cuenta.`);
      return null;
    }
    return failureMessage(result.reason, result.message);
  };

  const handleOwnPassword = async (password: string, current: string) => {
    const result = await changeOwnPassword(current, password);
    if (result.ok) {
      setDialog(null);
      setNotice({ tone: 'success', text: 'Tu contraseña se cambió. Úsala la próxima vez que inicies sesión.' });
      return null;
    }
    return failureMessage(result.reason, result.message);
  };

  const doctors = list.status === 'ready' ? list.doctors : [];
  const activeCount = doctors.filter((doctor) => doctor.activo).length;

  return (
    <div className="flex min-h-dvh flex-col bg-white text-base text-slate-900">
      <header className="flex h-16 shrink-0 items-center gap-3 bg-blue-900 px-4 sm:px-6">
        <Image src="/logoxd.png" alt="" width={36} height={36} className="h-9 w-9 shrink-0 object-contain" priority />
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-lg font-semibold text-white">XpertDiagnostic</p>
          <p className="truncate text-sm text-white/70">
            Panel de administración{profile ? ` | ID ${profile.usuarioId}` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDialog({ kind: 'own-password' })}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-white/90 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          <KeyRound aria-hidden="true" className="h-5 w-5" />
          <span className="max-sm:sr-only">Cambiar mi contraseña</span>
        </button>
        <button
          type="button"
          onClick={() => void endSession()}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-white/90 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          <LogOut aria-hidden="true" className="h-5 w-5" />
          <span className="max-sm:sr-only">Cerrar sesión</span>
        </button>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        <h1 className="sr-only">Panel de administración</h1>
        <div role="tablist" aria-label="Secciones del panel" className="mb-6 flex gap-1 rounded-lg bg-slate-100 p-1 sm:w-fit">
          {SECTIONS.map((item) => {
            const selected = section === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                id={`admin-tab-${item.id}`}
                aria-selected={selected}
                aria-controls={`admin-panel-${item.id}`}
                onClick={() => setSection(item.id)}
                className={`flex-1 rounded-md px-5 py-2 font-medium transition-colors sm:flex-none ${FOCUS_RING} ${
                  selected ? 'bg-blue-900 text-white' : 'text-slate-800 hover:bg-white'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {section === 'patients' && (
          <div role="tabpanel" id="admin-panel-patients" aria-labelledby="admin-tab-patients">
            <AdminPatientsSection onSessionEnded={endSession} />
          </div>
        )}

        {section === 'doctors' && (
        <div role="tabpanel" id="admin-panel-doctors" aria-labelledby="admin-tab-doctors">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3 border-b-2 border-slate-900 pb-3">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h2 className="text-2xl font-semibold text-slate-900">Médicos</h2>
            {list.status === 'ready' && (
              <p className="text-slate-700" aria-live="polite">
                {doctors.length} {doctors.length === 1 ? 'registrado' : 'registrados'}, {activeCount}{' '}
                {activeCount === 1 ? 'activo' : 'activos'}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setDialog({ kind: 'create' })}
            className={`rounded-md bg-blue-900 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-800 ${FOCUS_RING} focus-visible:ring-offset-2`}
          >
            Registrar médico
          </button>
        </div>

        {notice && (
          <div
            role={notice.tone === 'success' ? 'status' : 'alert'}
            className={`mt-5 flex items-start gap-4 border-2 px-4 py-3 ${
              notice.tone === 'success' ? 'border-green-700 text-green-900' : 'border-red-700 text-red-900'
            }`}
          >
            <p className="flex-1">{notice.text}</p>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className={`text-sm font-medium underline underline-offset-2 ${FOCUS_RING}`}
            >
              Ocultar
            </button>
          </div>
        )}

        <div className="mt-5">
          <label htmlFor="admin-search" className="mb-1 block text-sm font-medium text-slate-800">
            Buscar
          </label>
          <input
            id="admin-search"
            type="search"
            value={query}
            maxLength={120}
            autoComplete="off"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nombre, especialidad, ID o cédula"
            className="w-full max-w-md rounded-md border-2 border-slate-300 bg-white px-3 py-2 text-base text-slate-900 placeholder:text-slate-500 focus:border-[#116ee6] focus:outline-none"
          />
        </div>

        <section aria-label="Lista de médicos" className="mt-6">
          {list.status === 'loading' && (
            <div className="flex justify-center py-16">
              <LoadingDots className="h-16 w-16" label="Cargando médicos" />
            </div>
          )}

          {list.status === 'error' && (
            <div role="alert" className="flex flex-wrap items-center gap-4 border-2 border-red-700 px-4 py-3 text-red-900">
              <p className="flex-1">{list.message}</p>
              <button
                type="button"
                onClick={() => {
                  setList({ status: 'loading' });
                  void loadDoctors(query);
                }}
                className={`font-medium underline underline-offset-2 ${FOCUS_RING}`}
              >
                Reintentar
              </button>
            </div>
          )}

          {list.status === 'ready' && doctors.length === 0 && (
            <p className="py-10 text-slate-700">
              {query.trim()
                ? `Ningún médico coincide con «${query.trim()}».`
                : 'Aún no hay médicos registrados. Usa «Registrar médico» para crear la primera cuenta.'}
            </p>
          )}

          {list.status === 'ready' && doctors.length > 0 && (
            <ul className="divide-y-2 divide-slate-200 border-y-2 border-slate-200 md:hidden">
              {doctors.map((doctor) => (
                <li key={doctor.idMedico} className="py-4">
                  <p className="font-medium text-slate-900">
                    {doctor.nombreCompleto}
                    {!doctor.activo && <span className="font-normal text-slate-700"> (desactivada)</span>}
                  </p>
                  <p className="text-slate-700">
                    {doctorRoleLabel(doctor.rol)} | {doctor.especialidad}
                  </p>
                  <p className="mt-1 text-sm text-slate-800">
                    ID <span className="font-mono">{doctor.idMedico}</span>, cédula{' '}
                    <span className="font-mono">{doctor.cedulaProfesional}</span>, alta{' '}
                    {dateFormatter.format(new Date(doctor.fechaRegistro))}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
                    <RowActions doctor={doctor} onOpen={setDialog} />
                  </div>
                </li>
              ))}
            </ul>
          )}

          {list.status === 'ready' && doctors.length > 0 && (
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full border-collapse text-left">
                <thead className="text-sm text-slate-700">
                  <tr className="border-b-2 border-slate-300">
                    <th scope="col" className="py-2 pr-4 font-medium">Médico</th>
                    <th scope="col" className="py-2 pr-4 font-medium">Tipo</th>
                    <th scope="col" className="py-2 pr-4 font-medium">ID</th>
                    <th scope="col" className="py-2 pr-4 font-medium">Cédula</th>
                    <th scope="col" className="py-2 pr-4 font-medium">Fecha de alta</th>
                    <th scope="col" className="py-2 pr-4 font-medium">Estado</th>
                    <th scope="col" className="py-2 font-medium">
                      <span className="sr-only">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {doctors.map((doctor) => (
                    <tr key={doctor.idMedico} className="border-b-2 border-slate-200 align-top">
                      <td className="py-3 pr-4">
                        <p className="font-medium text-slate-900">{doctor.nombreCompleto}</p>
                        <p className="text-slate-700">{doctor.especialidad}</p>
                      </td>
                      <td className="py-3 pr-4 text-slate-800">{doctorRoleLabel(doctor.rol)}</td>
                      <td className="py-3 pr-4 font-mono text-slate-800">{doctor.idMedico}</td>
                      <td className="py-3 pr-4 font-mono text-slate-800">{doctor.cedulaProfesional}</td>
                      <td className="py-3 pr-4 whitespace-nowrap text-slate-800">
                        {dateFormatter.format(new Date(doctor.fechaRegistro))}
                      </td>
                      <td className={`py-3 pr-4 ${doctor.activo ? 'text-green-800' : 'text-slate-700'}`}>
                        {doctor.activo ? 'Activa' : 'Desactivada'}
                      </td>
                      <td className="py-3">
                        <div className="flex justify-end gap-x-4 whitespace-nowrap">
                          <RowActions doctor={doctor} onOpen={setDialog} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        </div>
        )}
      </main>

      <DoctorFormDialog mode="create" open={dialog?.kind === 'create'} onClose={closeDialog} onSubmit={handleCreate} />
      <DoctorFormDialog
        mode="edit"
        open={dialog?.kind === 'edit'}
        doctor={dialog?.kind === 'edit' ? dialog.doctor : null}
        onClose={closeDialog}
        onSubmit={(data) => (dialog?.kind === 'edit' ? handleUpdate(dialog.doctor, data) : Promise.resolve(null))}
      />
      <PasswordDialog
        open={dialog?.kind === 'password'}
        title="Asignar contraseña"
        description={
          dialog?.kind === 'password'
            ? `Contraseña nueva para ${dialog.doctor.nombreCompleto} (ID ${dialog.doctor.idMedico}). La anterior deja de funcionar.`
            : ''
        }
        onClose={closeDialog}
        onSubmit={(password) =>
          dialog?.kind === 'password' ? handleResetPassword(dialog.doctor, password) : Promise.resolve(null)
        }
      />
      <StatusDialog
        open={dialog?.kind === 'status'}
        doctor={dialog?.kind === 'status' ? dialog.doctor : null}
        onClose={closeDialog}
        onConfirm={handleStatus}
      />
      <DeleteDialog
        open={dialog?.kind === 'delete'}
        title="Eliminar médico"
        question={
          dialog?.kind === 'delete' && (
            <>
              ¿Eliminar a <strong className="font-semibold">{dialog.doctor.nombreCompleto}</strong> (ID{' '}
              {dialog.doctor.idMedico})?
            </>
          )
        }
        consequence="Se borran su registro de médico y su cuenta; ya no podrá iniciar sesión. Si solo quieres bloquearlo por un tiempo, mejor desactiva su cuenta."
        confirmLabel="Eliminar médico"
        onClose={closeDialog}
        onConfirm={() => (dialog?.kind === 'delete' ? handleDelete(dialog.doctor) : Promise.resolve(null))}
      />
      <PasswordDialog
        open={dialog?.kind === 'own-password'}
        title="Cambiar mi contraseña"
        description="Por seguridad, escribe primero tu contraseña actual."
        requireCurrent
        onClose={closeDialog}
        onSubmit={handleOwnPassword}
      />
    </div>
  );
}

/** Editar, contraseña, activar/desactivar y eliminar: las mismas acciones en la tabla y en la lista móvil. */
function RowActions({ doctor, onOpen }: { doctor: DoctorAccount; onOpen: (dialog: DialogState) => void }) {
  return (
    <>
      <RowAction
        label="Editar"
        description={`Editar datos de ${doctor.nombreCompleto}`}
        onClick={() => onOpen({ kind: 'edit', doctor })}
      />
      <RowAction
        label="Contraseña"
        description={`Asignar contraseña nueva a ${doctor.nombreCompleto}`}
        onClick={() => onOpen({ kind: 'password', doctor })}
      />
      <RowAction
        label={doctor.activo ? 'Desactivar' : 'Activar'}
        description={`${doctor.activo ? 'Desactivar' : 'Activar'} la cuenta de ${doctor.nombreCompleto}`}
        tone={doctor.activo ? 'danger' : 'default'}
        onClick={() => onOpen({ kind: 'status', doctor })}
      />
      <RowAction
        label="Eliminar"
        description={`Eliminar a ${doctor.nombreCompleto}`}
        tone="danger"
        onClick={() => onOpen({ kind: 'delete', doctor })}
      />
    </>
  );
}

function RowAction({
  label,
  description,
  tone = 'default',
  onClick,
}: {
  label: string;
  description: string;
  tone?: 'default' | 'danger';
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={description}
      className={`text-sm font-medium underline-offset-2 hover:underline ${FOCUS_RING} ${
        tone === 'danger' ? 'text-red-800' : 'text-blue-900'
      }`}
    >
      {label}
    </button>
  );
}
