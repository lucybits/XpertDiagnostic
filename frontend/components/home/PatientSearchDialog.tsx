'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, FileText, Search, SearchX, Stethoscope, UserRound, X } from 'lucide-react';
import { filterPatients, getDiagnosisOptions, hasActiveCriteria } from '@/lib/patientSearch';
import {
  DIAGNOSIS_ALL,
  DIAGNOSIS_NONE,
  EMPTY_PATIENT_SEARCH,
  type AgeFilter,
  type Patient,
  type PatientSearchCriteria,
} from '@/types/patient';

type PatientSearchDialogProps = {
  open: boolean;
  patients: readonly Patient[];
  onClose: () => void;
  onSelect: (patient: Patient) => void;
};

/** El médico tratante no da de alta pacientes: lo hace el administrador (P-144). */
const NOT_FOUND_HINT = 'Si el paciente no aparece, pide al administrador que lo registre.';

const FOCUS_RING = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#116ee6]/60';
const FIELD =
  'w-full rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-base text-slate-900 transition-colors hover:border-slate-300 focus:border-[#116ee6] focus:outline-none';

const AGE_OPTIONS: { value: AgeFilter; label: string }[] = [
  { value: 'all', label: 'Todas las edades' },
  { value: '0-17', label: '0 a 17 años' },
  { value: '18-39', label: '18 a 39 años' },
  { value: '40-64', label: '40 a 64 años' },
  { value: '65+', label: '65 años o más' },
];

/**
 * Ventana modal para buscar pacientes registrados por nombre o expediente, con filtros
 * sencillos. Usa el elemento <dialog> nativo: atrapa el foco, se cierra con Escape y el resto
 * de la página queda inerte mientras está abierta.
 */
export default function PatientSearchDialog({ open, patients, onClose, onSelect }: PatientSearchDialogProps) {
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
    // Al desmontarse u ocultarse la pantalla (Next conserva /home oculta al navegar), el diálogo
    // se cierra: un <dialog> modal abierto vuelve inerte toda la página nueva (P-107).
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
      className="m-auto h-[min(46rem,calc(100dvh-2rem))] w-[min(64rem,calc(100vw-2rem))] max-w-none overflow-hidden rounded-2xl border-2 border-slate-200 bg-white p-0 text-base text-slate-900 transition-[opacity,transform] duration-200 ease-out backdrop:bg-slate-950/50 starting:scale-[0.98] starting:opacity-0 motion-reduce:transition-none"
    >
      {/* El contenido se monta solo al abrir: así cada búsqueda empieza limpia. */}
      {open && (
        <SearchPanel
          titleId={titleId}
          patients={patients}
          onClose={onClose}
          onSelect={onSelect}
        />
      )}
    </dialog>
  );
}

type SearchPanelProps = Omit<PatientSearchDialogProps, 'open'> & { titleId: string };

function SearchPanel({ titleId, patients, onClose, onSelect }: SearchPanelProps) {
  const [criteria, setCriteria] = useState<PatientSearchCriteria>(EMPTY_PATIENT_SEARCH);
  const ids = useId();

  const results = useMemo(() => filterPatients(patients, criteria), [patients, criteria]);
  const diagnosisOptions = useMemo(() => {
    const { diagnoses, hasPatientsWithoutDiagnosis } = getDiagnosisOptions(patients);
    return [
      { value: DIAGNOSIS_ALL, label: 'Todos los diagnósticos' },
      ...diagnoses.map((name) => ({ value: name, label: name })),
      ...(hasPatientsWithoutDiagnosis ? [{ value: DIAGNOSIS_NONE, label: 'Sin diagnóstico' }] : []),
    ];
  }, [patients]);
  const filtersActive = hasActiveCriteria(criteria);

  const update = <K extends keyof PatientSearchCriteria>(key: K, value: PatientSearchCriteria[K]) =>
    setCriteria((current) => ({ ...current, [key]: value }));

  const clearFilters = () => setCriteria(EMPTY_PATIENT_SEARCH);

  return (
    <div className="flex h-full flex-col">
      {/* Encabezado */}
      <header className="flex items-start gap-4 border-b-2 border-slate-200 px-6 pt-5 pb-4">
        <div className="min-w-0 flex-1">
          <h2 id={titleId} className="text-xl font-semibold text-slate-900">
            Buscar paciente
          </h2>
          <p className="mt-0.5 text-base text-slate-700">
            Busca entre los pacientes registrados por nombre o número de expediente.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar buscador"
          className={`rounded-lg p-2 text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-800 ${FOCUS_RING}`}
        >
          <X aria-hidden="true" className="h-5 w-5" />
        </button>
      </header>

      {/* Búsqueda y filtros */}
      <div className="space-y-4 px-6 py-4">
        <div className="relative">
          <label htmlFor={`${ids}-query`} className="sr-only">
            Nombre o número de expediente
          </label>
          <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3.5 h-5 w-5 -translate-y-1/2 text-slate-600" />
          <input
            id={`${ids}-query`}
            data-autofocus
            type="search"
            autoComplete="off"
            placeholder="Nombre o número de expediente"
            value={criteria.query}
            onChange={(event) => update('query', event.target.value)}
            className={`${FIELD} py-3 pl-11 text-lg`}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <FilterSelect
            id={`${ids}-age`}
            label="Edad"
            value={criteria.age}
            options={AGE_OPTIONS}
            onChange={(value) => update('age', value)}
          />
          <FilterSelect
            id={`${ids}-diagnosis`}
            label="Diagnóstico"
            value={criteria.diagnosis}
            options={diagnosisOptions}
            onChange={(value) => update('diagnosis', value)}
          />
        </div>
      </div>

      {/* Resultados */}
      <div className="flex min-h-0 flex-1 flex-col border-t-2 border-slate-200">
        {results.length > 0 ? (
          <ul aria-label="Resultados de la búsqueda" className="flex-1 overflow-y-auto px-3 py-2">
            {results.map((patient) => (
              <li key={patient.id} className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onSelect(patient)}
                  className={`group flex min-w-0 flex-1 items-center gap-4 rounded-xl px-3 py-3 text-left transition-colors hover:bg-slate-50 ${FOCUS_RING}`}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                    <UserRound aria-hidden="true" className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-slate-900">{patient.fullName}</span>
                    <span className="block text-slate-700">
                      {patient.recordNumber} | {patient.age} años
                    </span>
                  </span>
                  <span className="hidden max-w-[40%] items-center gap-1.5 text-slate-700 sm:flex">
                    <Stethoscope aria-hidden="true" className="h-4 w-4 shrink-0" />
                    <span className="sr-only">Diagnóstico:</span>
                    <span className="truncate">{patient.diagnosis ?? 'Sin diagnóstico'}</span>
                  </span>
                  <ChevronRight
                    aria-hidden="true"
                    className="h-5 w-5 shrink-0 text-slate-300 transition-colors group-hover:text-slate-500"
                  />
                </button>
                {/* Con diagnóstico ya hay salida: se puede abrir directamente (P-105). */}
                {patient.diagnosis && (
                  <Link
                    href={`/patients/${patient.id}/result`}
                    // Cierra el buscador antes de salir de /home (P-107).
                    onClick={onClose}
                    className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 font-medium text-teal-800 transition-colors hover:bg-teal-50 ${FOCUS_RING}`}
                  >
                    <FileText aria-hidden="true" className="h-4 w-4" />
                    Ver resultado
                    <span className="sr-only"> de {patient.fullName}</span>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-10 text-center">
            <SearchX aria-hidden="true" className="h-10 w-10 text-slate-300" />
            {patients.length === 0 ? (
              <>
                <p className="font-medium text-slate-900">Aún no hay pacientes registrados</p>
                <p className="text-slate-700">
                  Cuando el administrador registre pacientes, podrás buscarlos aquí.
                </p>
              </>
            ) : (
              <>
                <p className="font-medium text-slate-900">No se encontraron pacientes</p>
                <p className="text-slate-700">Prueba con otro nombre o quita algunos filtros. {NOT_FOUND_HINT}</p>
              </>
            )}
            {filtersActive && (
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={clearFilters}
                  className={`rounded-lg px-3 py-2 font-medium text-[#116ee6] transition-colors hover:bg-blue-50 ${FOCUS_RING}`}
                >
                  Limpiar búsqueda y filtros
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pie */}
      <footer className="flex items-center gap-3 border-t-2 border-slate-200 px-6 py-3">
        <p aria-live="polite" className="flex-1 text-slate-700">
          {results.length === 1 ? '1 paciente encontrado' : `${results.length} pacientes encontrados`}
          {results.length > 0 && <span className="max-sm:hidden"> | {NOT_FOUND_HINT}</span>}
        </p>
        {filtersActive && results.length > 0 && (
          <button
            type="button"
            onClick={clearFilters}
            className={`rounded-lg px-3 py-2 font-medium text-slate-800 transition-colors hover:bg-slate-100 ${FOCUS_RING}`}
          >
            Limpiar filtros
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          className={`rounded-lg bg-[#0b1533] px-4 py-2 font-medium text-white transition-colors hover:bg-[#1a2650] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#116ee6]/60 focus-visible:ring-offset-2`}
        >
          Cancelar
        </button>
      </footer>
    </div>
  );
}

type FilterSelectProps<T extends string> = {
  id: string;
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
};

function FilterSelect<T extends string>({ id, label, value, options, onChange }: FilterSelectProps<T>) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block font-medium text-slate-700">
        {label}
      </label>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value as T)} className={FIELD}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
