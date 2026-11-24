'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  CircleAlert,
  CircleCheck,
  KeyRound,
  LogOut,
  Pencil,
  RotateCw,
  Search,
  UserRoundCheck,
  UserRoundPlus,
  UserRoundX,
} from 'lucide-react';
import LoadingDots from '@/components/ui/LoadingDots';
import DoctorFormDialog, { type SaveOutcome } from './DoctorFormDialog';
import PasswordDialog from './PasswordDialog';
import StatusDialog from './StatusDialog';
import { FOCUS_RING } from './AdminDialog';
import {
  changeOwnPassword,
  createDoctor,
  listDoctors,
  resetDoctorPassword,
  setDoctorStatus,
  updateDoctor,
} from '@/services/adminService';
import { getSessionState, logoutAndGoToLogin } from '@/services/doctorService';
import type { AdminFailure, DoctorAccount } from '@/types/admin';
import { HOME_ROUTE_BY_ROLE } from '@/types/auth';
import { USER_ROLES, type SessionProfile } from '@/types/doctor';

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
  | { kind: 'own-password' }
  | null;

type ListState = { status: 'loading' } | { status: 'ready'; doctors: DoctorAccount[] } | { status: 'error'; message: string };

const dateFormatter = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' });

/**
 * Panel de administración (ESP-007): alta y gestión de las cuentas de médicos.
 * Toda la información viene de la base de datos a través del backend; después de cada cambio se
 * vuelve a leer la lista, así lo que se ve es siempre lo que quedó guardado.
 */
export default function AdminPanel() {
  const router = useRouter();
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
      finish(`Se registró a ${result.data.nombreCompleto}. Ya puede iniciar sesión con el ID ${result.data.idMedico}.`);
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

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Médicos</h1>
            <p className="mt-1 text-slate-700">
              Registra médicos con su cédula profesional y administra sus cuentas de acceso.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDialog({ kind: 'create' })}
            className={`flex items-center gap-2 rounded-lg bg-[#0b1533] px-4 py-2.5 font-medium text-white transition-colors hover:bg-[#1a2650] ${FOCUS_RING} focus-visible:ring-offset-2`}
          >
            <UserRoundPlus aria-hidden="true" className="h-5 w-5" />
            Registrar médico
          </button>
        </div>

        {notice && (
          <div
            role={notice.tone === 'success' ? 'status' : 'alert'}
            className={`mt-6 flex items-start gap-3 rounded-xl border-2 p-4 ${
              notice.tone === 'success' ? 'border-green-200 bg-green-50 text-green-900' : 'border-red-200 bg-red-50 text-red-900'
            }`}
          >
            {notice.tone === 'success' ? (
              <CircleCheck aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
            ) : (
              <CircleAlert aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
            )}
            <p className="flex-1">{notice.text}</p>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className={`rounded-md px-2 text-sm font-medium underline underline-offset-2 ${FOCUS_RING}`}
            >
              Ocultar
            </button>
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="relative min-w-0 flex-1 basis-72">
            <label htmlFor="admin-search" className="sr-only">
              Buscar médico
            </label>
            <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-slate-700" />
            <input
              id="admin-search"
              type="search"
              value={query}
              maxLength={120}
              autoComplete="off"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nombre, especialidad, ID o cédula"
              className="w-full rounded-lg border-2 border-slate-200 bg-white py-2.5 pr-3 pl-10 text-base text-slate-900 transition-colors placeholder:text-slate-500 hover:border-slate-300 focus:border-[#116ee6] focus:outline-none"
            />
          </div>
          {list.status === 'ready' && (
            <p className="text-slate-800" aria-live="polite">
              {doctors.length} {doctors.length === 1 ? 'médico' : 'médicos'} | {activeCount} {activeCount === 1 ? 'activo' : 'activos'}
            </p>
          )}
        </div>

        <section aria-label="Lista de médicos" className="mt-4">
          {list.status === 'loading' && (
            <div className="flex justify-center py-16">
              <LoadingDots className="h-16 w-16" label="Cargando médicos" />
            </div>
          )}

          {list.status === 'error' && (
            <div role="alert" className="flex flex-wrap items-center gap-3 rounded-xl border-2 border-red-200 bg-red-50 p-4 text-red-900">
              <CircleAlert aria-hidden="true" className="h-5 w-5 shrink-0" />
              <p className="flex-1">{list.message}</p>
              <button
                type="button"
                onClick={() => {
                  setList({ status: 'loading' });
                  void loadDoctors(query);
                }}
                className={`flex items-center gap-2 rounded-lg border-2 border-red-300 px-3 py-1.5 font-medium hover:bg-red-100 ${FOCUS_RING}`}
              >
                <RotateCw aria-hidden="true" className="h-4 w-4" />
                Reintentar
              </button>
            </div>
          )}

          {list.status === 'ready' && doctors.length === 0 && (
            <p className="rounded-xl border-2 border-dashed border-slate-200 px-4 py-12 text-center text-slate-700">
              {query.trim()
                ? `Ningún médico coincide con «${query.trim()}».`
                : 'Aún no hay médicos registrados. Usa «Registrar médico» para crear la primera cuenta.'}
            </p>
          )}

          {list.status === 'ready' && doctors.length > 0 && (
            <ul className="space-y-3 md:hidden">
              {doctors.map((doctor) => (
                <li key={doctor.idMedico} className="rounded-xl border-2 border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900">{doctor.nombreCompleto}</p>
                      <p className="text-slate-700">{doctor.especialidad}</p>
                    </div>
                    <StatusBadge activo={doctor.activo} />
                  </div>
                  <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <dt className="text-slate-700">ID</dt>
                      <dd className="font-mono text-slate-800">{doctor.idMedico}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-700">Cédula</dt>
                      <dd className="font-mono text-slate-800">{doctor.cedulaProfesional}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-700">Alta</dt>
                      <dd className="text-slate-800">{dateFormatter.format(new Date(doctor.fechaRegistro))}</dd>
                    </div>
                  </dl>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <RowActions doctor={doctor} onOpen={setDialog} />
                  </div>
                </li>
              ))}
            </ul>
          )}

          {list.status === 'ready' && doctors.length > 0 && (
            <div className="hidden overflow-x-auto rounded-xl border-2 border-slate-200 md:block">
              <table className="w-full min-w-208 border-collapse text-left">
                <thead className="bg-slate-50 text-slate-800">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">ID</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Médico</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Cédula</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Alta</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Estado</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {doctors.map((doctor) => (
                    <tr key={doctor.idMedico} className="border-t-2 border-slate-100 align-top">
                      <td className="px-4 py-3 font-mono text-slate-700">{doctor.idMedico}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{doctor.nombreCompleto}</p>
                        <p className="text-slate-700">{doctor.especialidad}</p>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-700">{doctor.cedulaProfesional}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-800">
                        {dateFormatter.format(new Date(doctor.fechaRegistro))}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge activo={doctor.activo} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap justify-end gap-1.5">
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

function StatusBadge({ activo }: { activo: boolean }) {
  return (
    <span
      className={`inline-flex shrink-0 rounded-full border-2 px-2.5 py-0.5 text-sm font-semibold text-slate-900 ${
        activo ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-slate-100'
      }`}
    >
      {activo ? 'Activa' : 'Desactivada'}
    </span>
  );
}

/** Editar, contraseña y activar/desactivar: las mismas acciones en la tabla y en las tarjetas. */
function RowActions({ doctor, onOpen }: { doctor: DoctorAccount; onOpen: (dialog: DialogState) => void }) {
  return (
    <>
      <RowAction
        icon={Pencil}
        label="Editar"
        description={`Editar datos de ${doctor.nombreCompleto}`}
        onClick={() => onOpen({ kind: 'edit', doctor })}
      />
      <RowAction
        icon={KeyRound}
        label="Contraseña"
        description={`Asignar contraseña nueva a ${doctor.nombreCompleto}`}
        onClick={() => onOpen({ kind: 'password', doctor })}
      />
      <RowAction
        icon={doctor.activo ? UserRoundX : UserRoundCheck}
        label={doctor.activo ? 'Desactivar' : 'Activar'}
        description={`${doctor.activo ? 'Desactivar' : 'Activar'} la cuenta de ${doctor.nombreCompleto}`}
        tone={doctor.activo ? 'danger' : 'default'}
        onClick={() => onOpen({ kind: 'status', doctor })}
      />
    </>
  );
}

function RowAction({
  icon: Icon,
  label,
  description,
  tone = 'default',
  onClick,
}: {
  icon: typeof Pencil;
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
      className={`flex items-center gap-1.5 rounded-lg border-2 px-2.5 py-1.5 text-sm font-medium transition-colors ${FOCUS_RING} ${
        tone === 'danger'
          ? 'border-red-200 text-red-800 hover:bg-red-50'
          : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      <Icon aria-hidden="true" className="h-4 w-4" />
      {label}
    </button>
  );
}
