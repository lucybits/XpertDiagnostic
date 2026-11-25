'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';
import LoadingDots from '@/components/ui/LoadingDots';
import DeleteDialog from './DeleteDialog';
import IconAction from './IconAction';
import NewPatientDialog from './NewPatientDialog';
import { FOCUS_RING } from './AdminDialog';
import { deletePatient } from '@/services/adminService';
import { listPatients, registerPatient, type PatientListResult } from '@/services/patientService';
import type { AdminFailure } from '@/types/admin';
import type { NewPatient, Patient } from '@/types/patient';

type ListState = { status: 'loading' } | { status: 'ready'; patients: Patient[] } | { status: 'error'; message: string };
type DialogState = { kind: 'create' } | { kind: 'delete'; patient: Patient } | null;

const DELETE_FAILURES: Partial<Record<AdminFailure, string>> = {
  forbidden: 'Solo un administrador puede eliminar pacientes.',
  'not-found': 'No se encontró al paciente; quizá ya se eliminó. Actualiza la lista.',
  network: 'No hay conexión con el servidor. Revisa tu red e inténtalo de nuevo.',
};
const LIST_ERROR = 'No se pudo cargar la lista de pacientes. Inténtalo de nuevo.';

const dateFormatter = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' });

/** "AAAA-MM-DD" como fecha local legible (sin pasar por UTC, que la movería un día). */
function formatBirthDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  return year && month && day ? dateFormatter.format(new Date(year, month - 1, day)) : isoDate;
}

const ageLabel = (age: number) => `${age} ${age === 1 ? 'año' : 'años'}`;

/** Normaliza para buscar sin importar mayúsculas ni acentos. */
const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

/**
 * Pacientes en el panel de administración (P-144): el administrador da de alta y elimina pacientes.
 * La captura clínica (antecedentes, síntomas, signos, estudios) la hace después el médico tratante.
 * Después de cada cambio se vuelve a leer la lista de la base de datos.
 */
export default function AdminPatientsSection({
  onSessionEnded,
}: {
  /** Debe ser estable (useCallback): si cambia, la lista se vuelve a pedir. */
  onSessionEnded: () => void;
}) {
  const [list, setList] = useState<ListState>({ status: 'loading' });
  const [query, setQuery] = useState('');
  const [dialog, setDialog] = useState<DialogState>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const applyList = useCallback(
    (result: PatientListResult) => {
      if (result.ok) setList({ status: 'ready', patients: result.patients });
      else if (result.reason === 'unauthenticated') onSessionEnded();
      else setList({ status: 'error', message: LIST_ERROR });
    },
    [onSessionEnded],
  );

  const loadPatients = useCallback(() => listPatients().then(applyList), [applyList]);

  // La lista se pide al montar la sección; si la sección se cierra antes de que llegue, se ignora.
  useEffect(() => {
    let isActive = true;
    void listPatients().then((result) => {
      if (isActive) applyList(result);
    });
    return () => {
      isActive = false;
    };
  }, [applyList]);

  const patients = useMemo(() => (list.status === 'ready' ? list.patients : []), [list]);
  const results = useMemo(() => {
    const search = normalize(query.trim());
    if (!search) return patients;
    return patients.filter(
      (patient) => normalize(patient.fullName).includes(search) || normalize(patient.recordNumber).includes(search),
    );
  }, [patients, query]);

  const handleCreate = async (data: NewPatient): Promise<string | null> => {
    const result = await registerPatient(data);
    if (!result.ok) return result.message;
    setDialog(null);
    setNotice(`Se registró a ${result.patient.fullName} con el expediente ${result.patient.recordNumber}.`);
    void loadPatients();
    return null;
  };

  const handleDelete = async (patient: Patient): Promise<string | null> => {
    const result = await deletePatient(patient.id);
    if (result.ok) {
      setDialog(null);
      setNotice(`Se eliminó a ${patient.fullName} (expediente ${patient.recordNumber}) y todo su expediente.`);
      void loadPatients();
      return null;
    }
    if (result.reason === 'unauthenticated') onSessionEnded();
    return DELETE_FAILURES[result.reason] ?? 'No se pudo eliminar al paciente. Inténtalo de nuevo.';
  };

  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3 border-b-2 border-slate-900 pb-3">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h2 className="text-2xl font-semibold text-slate-900">Pacientes</h2>
          {list.status === 'ready' && (
            <p className="text-slate-700" aria-live="polite">
              {patients.length} {patients.length === 1 ? 'registrado' : 'registrados'}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setDialog({ kind: 'create' })}
          className={`rounded-md bg-blue-900 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-800 ${FOCUS_RING} focus-visible:ring-offset-2`}
        >
          Registrar paciente
        </button>
      </div>

      {notice && (
        <div role="status" className="mt-5 flex items-start gap-4 border-2 border-green-700 px-4 py-3 text-green-900">
          <p className="flex-1">{notice}</p>
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
        <label htmlFor="admin-patient-search" className="mb-1 block text-sm font-medium text-slate-800">
          Buscar
        </label>
        <input
          id="admin-patient-search"
          type="search"
          value={query}
          maxLength={120}
          autoComplete="off"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Nombre o número de expediente"
          className="w-full max-w-md rounded-md border-2 border-slate-300 bg-white px-3 py-2 text-base text-slate-900 placeholder:text-slate-500 focus:border-[#116ee6] focus:outline-none"
        />
      </div>

      <section aria-label="Lista de pacientes" className="mt-6">
        {list.status === 'loading' && (
          <div className="flex justify-center py-16">
            <LoadingDots className="h-16 w-16" label="Cargando pacientes" />
          </div>
        )}

        {list.status === 'error' && (
          <div role="alert" className="flex flex-wrap items-center gap-4 border-2 border-red-700 px-4 py-3 text-red-900">
            <p className="flex-1">{list.message}</p>
            <button
              type="button"
              onClick={() => {
                setList({ status: 'loading' });
                void loadPatients();
              }}
              className={`font-medium underline underline-offset-2 ${FOCUS_RING}`}
            >
              Reintentar
            </button>
          </div>
        )}

        {list.status === 'ready' && results.length === 0 && (
          <p className="py-10 text-slate-700">
            {query.trim()
              ? `Ningún paciente coincide con «${query.trim()}».`
              : 'Aún no hay pacientes registrados. Usa «Registrar paciente» para dar de alta al primero.'}
          </p>
        )}

        {list.status === 'ready' && results.length > 0 && (
          <ul className="divide-y-2 divide-slate-200 border-y-2 border-slate-200 md:hidden">
            {results.map((patient) => (
              <li key={patient.id} className="py-4">
                <p className="font-medium text-slate-900">{patient.fullName}</p>
                <p className="text-sm text-slate-800">
                  Expediente <span className="font-mono">{patient.recordNumber}</span>, nació el{' '}
                  {formatBirthDate(patient.birthDate)} ({ageLabel(patient.age)})
                </p>
                <p className="text-slate-700">{patient.diagnosis ?? 'Sin diagnóstico'}</p>
                <div className="mt-2">
                  <DeleteAction patient={patient} onOpen={setDialog} />
                </div>
              </li>
            ))}
          </ul>
        )}

        {list.status === 'ready' && results.length > 0 && (
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full border-collapse text-left">
              <thead className="text-sm text-slate-700">
                <tr className="border-b-2 border-slate-300">
                  <th scope="col" className="py-2 pr-4 font-medium">Paciente</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Expediente</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Fecha de nacimiento</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Edad</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Diagnóstico</th>
                  <th scope="col" className="py-2 font-medium">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {results.map((patient) => (
                  <tr key={patient.id} className="border-b-2 border-slate-200 align-middle">
                    <td className="py-3 pr-4 font-medium text-slate-900">{patient.fullName}</td>
                    <td className="py-3 pr-4 font-mono text-slate-800">{patient.recordNumber}</td>
                    <td className="py-3 pr-4 whitespace-nowrap text-slate-800">{formatBirthDate(patient.birthDate)}</td>
                    <td className="py-3 pr-4 whitespace-nowrap text-slate-800">{ageLabel(patient.age)}</td>
                    <td className="py-3 pr-4 text-slate-700">{patient.diagnosis ?? 'Sin diagnóstico'}</td>
                    <td className="py-3 text-right">
                      <DeleteAction patient={patient} onOpen={setDialog} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <NewPatientDialog open={dialog?.kind === 'create'} onClose={() => setDialog(null)} onCreate={handleCreate} />
      <DeleteDialog
        open={dialog?.kind === 'delete'}
        title="Eliminar paciente"
        question={
          dialog?.kind === 'delete' && (
            <>
              ¿Eliminar a <strong className="font-semibold">{dialog.patient.fullName}</strong> (expediente{' '}
              {dialog.patient.recordNumber})?
            </>
          )
        }
        consequence="Se borran el paciente y todo su expediente: hallazgos capturados, diagnóstico, tratamiento y plan."
        confirmLabel="Eliminar paciente"
        onClose={() => setDialog(null)}
        onConfirm={() => (dialog?.kind === 'delete' ? handleDelete(dialog.patient) : Promise.resolve(null))}
      />
    </>
  );
}

/** Eliminar paciente: círculo rojo con ícono blanco, como las acciones de los médicos. */
function DeleteAction({ patient, onOpen }: { patient: Patient; onOpen: (dialog: DialogState) => void }) {
  return (
    <IconAction
      icon={Trash2}
      label="Eliminar"
      description={`Eliminar a ${patient.fullName}`}
      tone="delete"
      onClick={() => onOpen({ kind: 'delete', patient })}
    />
  );
}
