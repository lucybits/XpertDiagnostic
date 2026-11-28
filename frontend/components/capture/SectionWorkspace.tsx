'use client';

import { useRef, useState, type UIEvent } from 'react';
import { Search } from 'lucide-react';
import type { ClinicalSection } from '@/components/home/clinicalSections';
import type { Patient } from '@/types/patient';
import type { DiagnosisResult, PatientRecord } from '@/types/record';
import type { ValidationSummary } from '@/types/validation';
import type { PatientHistory } from '@/types/history';
import DiagnosisPanel from './DiagnosisPanel';
import HistoryCapture from './HistoryCapture';
import HypothesisCapture from './HypothesisCapture';
import SectionCapture from './SectionCapture';
import SectionHeader, { ShowSectionHeaderButton } from './SectionHeader';
import SessionPatientPill from './SessionPatientPill';
import { FOCUS_RING } from './styles';

type SectionWorkspaceProps = {
  groupLabel: string;
  section: ClinicalSection;
  /** Posición de la sección (1..total) para el indicador de avance. */
  position: number;
  total: number;
  /** Encabezado oculto por completo (lo recuerda HomeScreen al cambiar de sección). */
  isHeaderCollapsed: boolean;
  onToggleHeader: () => void;
  patient: Patient | null;
  onSearchPatient: () => void;
  /** Expediente capturado del paciente (null mientras carga o sin paciente). */
  record: PatientRecord | null;
  /** Se guardó la sección actual: HomeScreen la marca y pasa a la siguiente (P-103). */
  onSectionSaved: (record: PatientRecord) => void;
  /** Interrogatorio guardado del paciente (P-159), o null mientras carga. */
  history: PatientHistory | null;
  /** Se guardó una parte del interrogatorio: HomeScreen la marca y pasa a la siguiente. */
  onHistorySaved: (history: PatientHistory) => void;
  /** Último análisis del paciente, si ya se hizo. */
  diagnosis: DiagnosisResult | null;
  /** Se guardaron hallazgos después del análisis (P-112). */
  isDiagnosisStale: boolean;
  onAnalyzed: (result: DiagnosisResult) => void;
  /** Cambió la validación del diagnóstico: se envió al internista o él ya lo confirmó (P-151). */
  onValidationChanged: (summary: ValidationSummary) => void;
};

/**
 * Centro de la pantalla del médico tratante (interfaz de entrada). Con paciente: encabezado de la
 * sección y su captura (catálogos) o, en el último paso, el diagnóstico diferencial. Sin paciente:
 * un aviso para buscarlo. Se monta de nuevo al cambiar de sección o de paciente (key en HomeScreen).
 */
export default function SectionWorkspace({
  groupLabel,
  section,
  position,
  total,
  isHeaderCollapsed,
  onToggleHeader,
  patient,
  onSearchPatient,
  record,
  onSectionSaved,
  history,
  onHistorySaved,
  diagnosis,
  isDiagnosisStale,
  onAnalyzed,
  onValidationChanged,
}: SectionWorkspaceProps) {
  // Píldora del paciente (P-104): se esconde al bajar y vuelve al subir o cerca del inicio.
  const [isPillHidden, setIsPillHidden] = useState(false);
  const lastScrollTopRef = useRef(0);

  // Dirección del scroll: ignora movimientos menores a 8 px para que la píldora no parpadee.
  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    const top = event.currentTarget.scrollTop;
    const delta = top - lastScrollTopRef.current;
    if (top < 24) setIsPillHidden(false);
    else if (delta > 8) setIsPillHidden(true);
    else if (delta < -8) setIsPillHidden(false);
    else return;
    lastScrollTopRef.current = top;
  };

  return (
    <section aria-label="Captura del expediente" className="flex h-full min-h-0 flex-col bg-white">
      <SectionHeader
        groupLabel={groupLabel}
        section={section}
        position={position}
        total={total}
        isCollapsed={isHeaderCollapsed}
        onToggle={onToggleHeader}
      />

      <div className="relative min-h-0 flex-1">
        {/* Paciente de la sesión, fijo arriba a la izquierda (P-101); a la derecha, el botón del encabezado. */}
        {patient && <SessionPatientPill patient={patient} hidden={isPillHidden} />}
        {isHeaderCollapsed && <ShowSectionHeaderButton sectionLabel={section.label} onShow={onToggleHeader} />}
        <div onScroll={handleScroll} className="relative flex h-full flex-col overflow-y-auto scrollbar-thin">
          {patient ? (
            // Captura estructurada de la sección (P-103): elegir del catálogo y guardar; al final, analizar.
            <div className="pt-16 pb-8">
              {section.capture.kind === 'analysis' ? (
                <DiagnosisPanel
                  patientId={patient.id}
                  result={diagnosis}
                  isStale={isDiagnosisStale}
                  onAnalyzed={onAnalyzed}
                  onValidationChanged={onValidationChanged}
                />
              ) : section.capture.kind === 'hypothesis' ? (
                // El campo toma lo guardado al montarse: se espera a que llegue el expediente.
                record === null ? (
                  <p role="status" className="mx-auto w-full max-w-4xl px-4 py-8 text-slate-700 sm:px-8">
                    Cargando expediente…
                  </p>
                ) : (
                  <HypothesisCapture
                    patientId={patient.id}
                    sectionLabel={section.label}
                    record={record}
                    onSaved={onSectionSaved}
                  />
                )
              ) : section.capture.kind === 'non-pathological' || section.capture.kind === 'pathological' ? (
                // El formulario toma lo guardado al montarse: se espera a que llegue el interrogatorio.
                history === null ? (
                  <p role="status" className="mx-auto w-full max-w-4xl px-4 py-8 text-slate-700 sm:px-8">
                    Cargando antecedentes…
                  </p>
                ) : (
                <HistoryCapture
                  patientId={patient.id}
                  sectionLabel={section.label}
                  kind={section.capture.kind}
                  history={history}
                  onSaved={onHistorySaved}
                />
                )
              ) : (
                <SectionCapture
                  patientId={patient.id}
                  sectionLabel={section.label}
                  capture={section.capture}
                  record={record}
                  onSaved={onSectionSaved}
                />
              )}
            </div>
          ) : (
            <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-start justify-center gap-4 px-4 py-12 sm:px-8">
              <p className="text-lg text-slate-900">Selecciona un paciente para comenzar la captura.</p>
              <button
                type="button"
                onClick={onSearchPatient}
                className={`inline-flex min-h-11 items-center gap-2 bg-teal-700 px-5 py-2 font-semibold text-white transition-colors hover:bg-teal-800 ${FOCUS_RING} focus-visible:ring-offset-2`}
              >
                <Search aria-hidden="true" className="h-5 w-5" />
                Buscar paciente
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
