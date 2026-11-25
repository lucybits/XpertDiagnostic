'use client';

import { useId } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  ClipboardPlus,
  Hourglass,
  FileText,
  FlaskConical,
  Lock,
  Microscope,
  PanelRightClose,
  PanelRightOpen,
  Stethoscope,
  Thermometer,
  TriangleAlert,
  UserRound,
  X,
  type LucideIcon,
} from 'lucide-react';
import type { ClinicalSectionGroup } from './clinicalSections';
import type { Patient } from '@/types/patient';
import type { DiagnosisResult } from '@/types/record';
import { VALIDATION_STATES } from '@/types/validation';

/** Un hallazgo del paciente (fila de HALLAZGOS_PACIENTE). */
export interface PatientFinding {
  id: string;
  description: string;
  /** 'presente' o una medición, p. ej. "240". */
  value: string;
  unit: string | null;
}

/** Tipos de HALLAZGOS_PACIENTE.TipoHallazgo, en el orden en que se muestran. */
export type FindingType = 'Sintoma' | 'Signo' | 'Estudio_lab' | 'Estudio_diagdif' | 'Comorbilidad' | 'Complicacion';

// Cada tipo de hallazgo tiene su banner ilustrado (public/*-banner.png, 2172×724, ilustración a la derecha).
const FINDING_GROUPS: readonly {
  type: FindingType;
  label: string;
  banner: string;
  icon: LucideIcon;
  /** Fondo del círculo del ícono, en el tono de su banner. */
  iconClassName: string;
}[] = [
  { type: 'Sintoma', label: 'Síntomas', banner: '/sintomas-banner.png', icon: Thermometer, iconClassName: 'bg-indigo-500' },
  { type: 'Signo', label: 'Signos', banner: '/signos-banner.png', icon: Activity, iconClassName: 'bg-blue-600' },
  {
    type: 'Estudio_lab',
    label: 'Estudios de laboratorio',
    banner: '/estudioslab-banner.png',
    icon: FlaskConical,
    iconClassName: 'bg-emerald-600',
  },
  {
    type: 'Estudio_diagdif',
    label: 'Estudios de diagnóstico diferencial',
    banner: '/diagnosticodif-banner.png',
    icon: Microscope,
    iconClassName: 'bg-violet-600',
  },
  {
    type: 'Comorbilidad',
    label: 'Comorbilidades',
    banner: '/comorbilidades-banner.png',
    icon: ClipboardPlus,
    iconClassName: 'bg-orange-500',
  },
  {
    type: 'Complicacion',
    label: 'Complicaciones',
    banner: '/complicaciones-banner.png',
    icon: TriangleAlert,
    iconClassName: 'bg-rose-500',
  },
];

type PatientRecordPanelProps = {
  patient: Patient | null;
  sectionGroups: readonly ClinicalSectionGroup[];
  /** Hallazgos guardados en HALLAZGOS_PACIENTE, por tipo (P-103). */
  findings?: Partial<Record<FindingType, readonly PatientFinding[]>>;
  /** Último análisis del paciente (salida de la máquina de inferencia), si ya se hizo. */
  diagnosis?: DiagnosisResult | null;
  /** Los hallazgos cambiaron después del análisis (P-112). */
  isDiagnosisStale?: boolean;
  /** Solo en el modo cajón (pantallas medianas y móvil). */
  onClose?: () => void;
  /** Solo en la columna fija (xl): plegado como lomo de libro (P-75). */
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
};

const PANEL_ID = 'patient-record-panel';
const EASE = 'ease-[cubic-bezier(0.22,1,0.36,1)]';

/**
 * Panel derecho con el resumen del expediente del paciente seleccionado: ficha, avance de la
 * captura, hallazgos registrados y, al final del flujo, el diagnóstico diferencial.
 * Los hallazgos vienen del expediente guardado (P-103).
 *
 * En la columna fija se puede plegar (P-75): queda un "lomo" angosto con el título en vertical,
 * los íconos de hallazgos con su número y el avance como barra vertical. El contenido completo
 * conserva su ancho y se desliza hacia el borde (no se reacomoda en cada fotograma).
 */
export default function PatientRecordPanel({
  patient,
  sectionGroups,
  findings = {},
  diagnosis = null,
  isDiagnosisStale = false,
  onClose,
  collapsed = false,
  onToggleCollapsed,
}: PatientRecordPanelProps) {
  const ids = useId();
  const sections = sectionGroups.flatMap((group) => group.sections);
  const completed = sections.filter((section) => section.status === 'complete').length;
  const percent = sections.length === 0 ? 0 : Math.round((completed / sections.length) * 100);
  const isFoldable = onToggleCollapsed !== undefined;

  const fullPanel = (
    <div
      id={isFoldable ? PANEL_ID : undefined}
      className={
        isFoldable
          ? `absolute inset-y-0 right-0 flex w-[calc(20rem-2px)] flex-col bg-white transition-[translate,opacity,visibility] duration-400 ${EASE} motion-reduce:transition-none ${
              collapsed ? 'invisible translate-x-8 opacity-0' : ''
            }`
          : 'flex h-full flex-col'
      }
    >
      <header className="flex items-center gap-3 border-b-2 border-slate-200 px-5 py-4">
        <h2 className="flex-1 text-lg font-semibold">
          Expediente
        </h2>
        {isFoldable && (
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label="Plegar expediente"
            aria-expanded={!collapsed}
            aria-controls={PANEL_ID}
            className="rounded-lg p-2 text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#116ee6]/60"
          >
            <PanelRightClose aria-hidden="true" className="h-5 w-5" />
          </button>
        )}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar expediente"
            className="rounded-lg p-2 text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#116ee6]/60"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        )}
      </header>

      <div className="relative min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5 scrollbar-thin">
        {/* Ficha del paciente */}
        {patient ? (
          <section aria-label="Paciente" className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700">
              <UserRound aria-hidden="true" className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold">{patient.fullName}</p>
              <p className="text-slate-700">
                {patient.recordNumber} | {patient.age} años
              </p>
            </div>
          </section>
        ) : (
          <section
            aria-label="Paciente"
            className="flex flex-col items-center gap-2 rounded-xl bg-slate-100 px-4 py-6 text-center text-slate-800"
          >
            <Image
              src="/usernofound.png"
              alt=""
              width={80}
              height={80}
              className="mb-1 h-20 w-20 object-contain"
            />
            <p className="font-medium">Sin paciente seleccionado</p>
            <p className="text-slate-800">Selecciona un paciente para ver su expediente.</p>
          </section>
        )}

        {/* Avance de la captura */}
        <section aria-labelledby={`${ids}-record-progress-title`}>
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <h3 id={`${ids}-record-progress-title`} className="font-semibold">
              Avance de la captura
            </h3>
            <span className="text-slate-700">
              {completed} de {sections.length}
            </span>
          </div>
          <div
            role="progressbar"
            aria-labelledby={`${ids}-record-progress-title`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            className="h-2 overflow-hidden rounded-none bg-slate-100"
          >
            <div
              className="h-full rounded-none bg-emerald-500 transition-[width] duration-500 ease-out motion-reduce:transition-none"
              style={{ width: `${percent}%` }}
            />
          </div>
        </section>

        {/* Hallazgos registrados */}
        <section aria-labelledby={`${ids}-record-findings-title`}>
          <h3 id={`${ids}-record-findings-title`} className="mb-3 font-semibold">
            Hallazgos registrados
          </h3>
          <ul className="space-y-2">
            {FINDING_GROUPS.map(({ type, label, banner, icon: Icon, iconClassName }) => {
              const items = findings[type] ?? [];
              return (
                <li key={type} className="group overflow-hidden rounded-xl border-2 border-slate-100 bg-white">
                  {/* Franja con el banner: el texto va a la izquierda, sobre la zona libre de la ilustración. */}
                  <div className="relative isolate flex min-h-24 flex-col justify-center overflow-hidden px-3.5 py-3">
                    <Image
                      src={banner}
                      alt=""
                      fill
                      quality={90}
                      sizes="(min-width: 1280px) 280px, 320px"
                      className="-z-10 scale-150 object-cover object-right blur-[24px] transition-[filter,scale] duration-500 ease-out group-hover:scale-100 group-hover:blur-none motion-reduce:transition-none"
                    />
                    <span className="absolute top-2.5 right-2.5 min-w-7 rounded-none bg-[#0b1533] px-2 text-center font-medium text-white tabular-nums">
                      <span className="sr-only">Registros: </span>
                      {items.length}
                    </span>
                    <div className="max-w-[60%]">
                      <p className="flex items-center gap-2 leading-snug font-semibold text-slate-900">
                        <span
                          aria-hidden="true"
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white ${iconClassName}`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        {label}
                      </p>
                      {items.length === 0 && <p className="mt-0.5 pl-9 text-slate-700">Sin registros</p>}
                    </div>
                  </div>

                  {items.length > 0 && (
                    <ul className="flex flex-wrap gap-1.5 border-t-2 border-slate-100 px-3.5 py-2.5">
                      {items.map((item) => (
                        <li key={item.id} className="rounded-md border-2 border-slate-200 px-2 py-0.5 text-slate-700">
                          {item.description}
                          {item.value !== 'presente' && (
                            <span className="text-slate-700">
                              {' '}
                              | {item.value}
                              {item.unit ? ` ${item.unit}` : ''}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        {/* Diagnóstico diferencial (salida de la máquina de inferencia) */}
        <section aria-labelledby={`${ids}-record-diagnosis-title`}>
          <h3 id={`${ids}-record-diagnosis-title`} className="mb-3 flex items-center gap-2 font-semibold">
            Diagnóstico diferencial
            {diagnosis?.provisional && !isDiagnosisStale && (
              <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-900">provisional</span>
            )}
            {diagnosis && isDiagnosisStale && (
              <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-900">desactualizado</span>
            )}
          </h3>
          {diagnosis && diagnosis.candidatos.length > 0 ? (
            <ol
              className={`space-y-2 ${isDiagnosisStale ? 'opacity-50' : ''}`}
              aria-describedby={isDiagnosisStale ? `${ids}-record-diagnosis-stale` : undefined}
            >
              {/* Candidatos más visibles (P-113, en azul por P-114): número en círculo (el primero
                  resaltado), nombre completo, barra de coincidencia y el confirmado señalado. */}
              {diagnosis.candidatos.map((candidate, index) => {
                const percent = Math.round(candidate.puntaje * 100);
                const isFirst = index === 0;
                const isConfirmed = patient?.diagnosis === candidate.nombre;
                return (
                  <li
                    key={candidate.idEnfermedad}
                    className={`flex items-start gap-3 rounded-xl border-2 px-3.5 py-3 ${
                      isFirst ? 'border-[#1e47c5] bg-white' : 'border-slate-100 bg-white'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${
                        isFirst ? 'bg-[#1e47c5]' : 'bg-[#0b1533]'
                      }`}
                    >
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="leading-snug font-semibold text-slate-900">
                        <span className="sr-only">{index + 1}. </span>
                        {candidate.nombre}
                      </p>
                      {isConfirmed && (
                        <span className="mt-1 inline-block rounded-md bg-[#0b1533] px-1.5 py-0.5 text-xs font-semibold text-white">
                          Confirmado
                        </span>
                      )}
                      <div
                        role="meter"
                        aria-label={`Coincidencia con ${candidate.nombre}`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={percent}
                        className="mt-2 flex items-center gap-2.5"
                      >
                        <span className="h-2 flex-1 overflow-hidden rounded-none bg-slate-200">
                          <span
                            className={`block h-full rounded-none ${isFirst ? 'bg-[#1e47c5]' : 'bg-blue-300'}`}
                            style={{ width: `${Math.max(percent, 3)}%` }}
                          />
                        </span>
                        <span className="w-10 text-right text-sm font-bold text-slate-900 tabular-nums">{percent}%</span>
                      </div>
                      <p className="mt-0.5 text-sm text-slate-800 tabular-nums">
                        {candidate.coincidencias} de {candidate.totalCriterios} criterios
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          ) : (
            <div className="flex items-start gap-3 rounded-xl border-2 border-dashed border-slate-400 px-4 py-4 text-slate-700">
              <Stethoscope aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-slate-600" strokeWidth={2.25} />
              <p>{diagnosis ? 'Sin coincidencias con la base de conocimiento.' : 'Disponible al analizar el expediente.'}</p>
            </div>
          )}
          {diagnosis && isDiagnosisStale && (
            <p id={`${ids}-record-diagnosis-stale`} className="mt-2 text-sm text-amber-900">
              Los hallazgos cambiaron: actualiza el expediente en «Diagnóstico diferencial».
            </p>
          )}
          {/* Validación del médico internista (P-151): mientras espera se dice; el diagnóstico solo existe
              cuando él lo confirma. */}
          {patient?.validationState === VALIDATION_STATES.pending && (
            <p role="status" className="mt-3 flex items-start gap-2 text-sm text-slate-800">
              <Hourglass aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[#1e47c5]" />
              En validación del médico internista.
            </p>
          )}
          {/* Interfaz de salida (P-110, P-111, P-165): el resultado solo se abre con un diagnóstico confirmado
              por el internista. Si se reenvió y está pendiente, el acceso queda bloqueado hasta que confirme. */}
          {patient?.diagnosis && patient.validationState === VALIDATION_STATES.confirmed ? (
            <>
              <p className="mt-3 text-slate-700">
                <span className="text-slate-700">Confirmado por el médico internista: </span>
                <span className="font-semibold text-slate-900">{patient.diagnosis}</span>
              </p>
              <Link
                href={`/patients/${patient.id}/result`}
                className="group mt-3 flex items-center justify-center gap-2 rounded-xl border-2 border-[#1e47c5] px-4 py-2.5 font-semibold text-[#1e47c5] transition-colors hover:bg-[#1e47c5] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1e47c5] focus-visible:ring-offset-2"
              >
                <FileText aria-hidden="true" className="h-4 w-4" />
                Ver resultado del expediente
                <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </>
          ) : patient && (patient.validationState === VALIDATION_STATES.pending || patient.diagnosis) ? (
            <>
              {/* Bloqueado (P-165): enfocable con aria-disabled para que el lector de pantalla lo anuncie. */}
              <span
                role="link"
                aria-disabled="true"
                aria-describedby={`${ids}-result-locked`}
                tabIndex={0}
                className="mt-3 flex cursor-not-allowed items-center justify-center gap-2 border-2 border-slate-300 bg-slate-100 px-4 py-2.5 font-semibold text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
              >
                <Lock aria-hidden="true" className="h-4 w-4" />
                Ver resultado del expediente
              </span>
              <p id={`${ids}-result-locked`} className="mt-2 text-sm text-slate-700">
                {patient.validationState === VALIDATION_STATES.pending
                  ? 'Disponible cuando el médico internista confirme el diagnóstico.'
                  : 'Envía el diagnóstico diferencial al médico internista; el resultado estará disponible cuando lo confirme.'}
              </p>
            </>
          ) : (
            patient && (
              <p className="mt-3 text-sm text-slate-700">
                {diagnosis && diagnosis.candidatos.length > 0
                  ? 'Envía el diagnóstico diferencial al médico internista para que confirme uno de los candidatos.'
                  : 'Cuando el médico internista confirme el diagnóstico podrás ver el resultado del expediente.'}
              </p>
            )
          )}
        </section>
      </div>
    </div>
  );

  if (!isFoldable) return <div className="h-full bg-white text-base text-slate-900">{fullPanel}</div>;

  return (
    <div className="relative h-full overflow-hidden bg-white text-base text-slate-900">
      {/* Lomo: todo el lomo es un botón que vuelve a abrir el expediente. */}
      <button
        type="button"
        onClick={onToggleCollapsed}
        aria-expanded={false}
        aria-controls={PANEL_ID}
        tabIndex={collapsed ? 0 : -1}
        aria-hidden={!collapsed}
        className={`absolute inset-y-0 left-0 flex w-[calc(4rem-2px)] cursor-pointer flex-col items-center gap-3 overflow-hidden py-4 transition-[opacity,background-color] duration-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#116ee6]/60 focus-visible:ring-inset motion-reduce:transition-none ${
          collapsed ? 'opacity-100 delay-150' : 'pointer-events-none opacity-0'
        }`}
      >
        <span className="sr-only">
          Mostrar expediente. Avance: {completed} de {sections.length} secciones.
        </span>
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0b1533] text-white"
        >
          <PanelRightOpen className="h-5 w-5" />
        </span>
        <span
          aria-hidden="true"
          className="max-h-52 shrink-0 rotate-180 truncate font-semibold tracking-wide text-[#0b1533] [writing-mode:vertical-rl]"
        >
          Expediente
        </span>
        {/* Los seis íconos siempre completos: no se encogen (P-100); lo que se adapta al alto es la barra de avance. */}
        <span aria-hidden="true" className="flex shrink-0 flex-col items-center gap-2.5">
          {FINDING_GROUPS.map(({ type, label, icon: Icon, iconClassName }) => {
            const count = findings[type]?.length ?? 0;
            return (
              <span
                key={type}
                title={`${label}: ${count}`}
                className="relative shrink-0 transition-transform duration-200 ease-out hover:scale-115 motion-reduce:transition-none"
              >
                <span className={`flex h-8 w-8 items-center justify-center rounded-full text-white ${iconClassName}`}>
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                {count > 0 && (
                  <span className="absolute -top-1 -right-1.5 min-w-4.5 rounded-none border-2 border-white bg-[#0b1533] px-1 text-center text-xs leading-4 font-medium text-white tabular-nums">
                    {count}
                  </span>
                )}
              </span>
            );
          })}
        </span>
        {/* Avance como barra vertical que se llena de abajo hacia arriba. */}
        <span aria-hidden="true" className="mt-auto flex min-h-0 flex-1 flex-col items-center justify-end gap-1.5">
          <span className="relative max-h-24 min-h-6 w-2 flex-1 overflow-hidden rounded-none bg-slate-100">
            <span
              className="absolute inset-x-0 bottom-0 rounded-none bg-emerald-500 transition-[height] duration-500 ease-out motion-reduce:transition-none"
              style={{ height: `${percent}%` }}
            />
          </span>
          <span className="text-sm text-slate-700 tabular-nums">
            {completed}/{sections.length}
          </span>
        </span>
      </button>

      {fullPanel}
    </div>
  );
}
