'use client';

import { useEffect, useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, CircleAlert, CircleCheck, FlaskConical, Microscope, ShieldCheck } from 'lucide-react';
import { analyzePatient } from '@/services/recordService';
import { confirmDiagnosis } from '@/services/resultService';
import type { DiagnosisResult } from '@/types/record';

type DiagnosisPanelProps = {
  patientId: string;
  result: DiagnosisResult | null;
  /** Los hallazgos cambiaron después de este análisis: hay que volver a analizar (P-112). */
  isStale: boolean;
  /** Llega el resultado: HomeScreen lo guarda para el expediente y marca la sección. */
  onAnalyzed: (result: DiagnosisResult) => void;
  /** El médico confirmó un diagnóstico: HomeScreen lo anota en el paciente (P-111). */
  onConfirmed: (diseaseName: string) => void;
};

/**
 * Último paso (P-103): analiza los hallazgos guardados con la máquina de inferencia registrada en
 * el backend y muestra el diagnóstico diferencial. Mientras el motor sea provisional lo dice
 * claramente. El médico confirma uno de los candidatos y pasa a la interfaz de salida (P-105).
 */
export default function DiagnosisPanel({ patientId, result, isStale, onAnalyzed, onConfirmed }: DiagnosisPanelProps) {
  const ids = useId();
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  // Hora del último análisis hecho aquí y aviso breve de "actualizado" (P-114).
  const [analyzedAt, setAnalyzedAt] = useState<number | null>(null);
  const [justUpdated, setJustUpdated] = useState(false);

  // Next conserva esta pantalla oculta al ir a la interfaz de salida; al ocultarse se limpia el
  // "Confirmando…" para que, al volver, el botón esté disponible y no quede esperando (P-108).
  useEffect(() => () => setConfirming(null), []);
  const router = useRouter();

  // El médico confirma un candidato: se guarda como enfermedad diagnosticada y se abre la
  // interfaz de salida (P-105).
  const confirm = async (diseaseId: string, diseaseName: string) => {
    setConfirming(diseaseId);
    setError(null);
    const response = await confirmDiagnosis(patientId, diseaseId);
    if (response.ok) {
      onConfirmed(diseaseName);
      router.push(`/patients/${patientId}/result`);
      return;
    }
    setConfirming(null);
    setError(response.message);
  };

  const analyze = async () => {
    setIsRunning(true);
    setError(null);
    setJustUpdated(false);
    const response = await analyzePatient(patientId);
    setIsRunning(false);
    if (response.ok) {
      onAnalyzed(response.data);
      setAnalyzedAt(Date.now());
      setJustUpdated(true);
    } else setError(response.message);
  };

  // Estado del botón (P-114): con el análisis al día no hay nada que recalcular (el motor da lo mismo
  // con los mismos hallazgos), así que se deshabilita y lo dice; solo se reactiva si cambian los hallazgos.
  const isUpToDate = result !== null && !isStale;
  const analyzeLabel = isRunning
    ? 'Analizando…'
    : result === null
      ? 'Analizar expediente'
      : isStale
        ? 'Volver a analizar'
        : 'Análisis al día';

  return (
    <section
      aria-labelledby={`${ids}-title`}
      className="mx-auto w-full max-w-4xl px-4 pb-2 transition-opacity duration-300 starting:opacity-0 motion-reduce:transition-none sm:px-8"
    >
      <div className="rounded-2xl border-2 border-slate-200 bg-white">
        <header className="flex flex-wrap items-start gap-3 border-b-2 border-slate-100 px-5 pt-4 pb-3">
          <div className="min-w-0 flex-1">
            <h3 id={`${ids}-title`} className="text-lg font-semibold text-[#0b1533]">
              Diagnóstico diferencial
            </h3>
            <p className="mt-0.5 text-slate-600">
              Compara los hallazgos guardados con la base de conocimiento y ordena las enfermedades más probables.
            </p>
          </div>
          {result?.provisional && (
            <span className="rounded-md bg-amber-100 px-2 py-0.5 text-sm font-medium text-amber-900">
              Motor provisional
            </span>
          )}
        </header>

        <div className="space-y-3 px-5 py-4">
          {/* Análisis desactualizado (P-112): no se confirma con datos que ya cambiaron. */}
          {result && isStale && (
            <p role="status" className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-amber-900">
              <CircleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
              Los hallazgos cambiaron después de este análisis. Vuelve a analizar para actualizarlo antes de confirmar
              un diagnóstico.
            </p>
          )}
          {result === null ? (
            <p className="text-slate-600">Cuando termines de capturar, analiza el expediente.</p>
          ) : result.candidatos.length === 0 ? (
            <p className="text-slate-600">
              No hay coincidencias con la base de conocimiento. Revisa que las secciones tengan hallazgos guardados.
            </p>
          ) : (
            <ol aria-label="Enfermedades candidatas" className="space-y-3">
              {result.candidatos.map((candidate, index) => {
                const percent = Math.round(candidate.puntaje * 100);
                return (
                  <li key={candidate.idEnfermedad} className="rounded-xl border-2 border-slate-100 px-4 py-3">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="text-sm font-semibold text-slate-500 tabular-nums">{index + 1}.</span>
                      <span className="text-lg font-semibold text-slate-900">{candidate.nombre}</span>
                      <span className="text-sm text-slate-500 tabular-nums">
                        {candidate.coincidencias} de {candidate.totalCriterios} criterios
                      </span>
                    </div>
                    <div
                      role="meter"
                      aria-label={`Coincidencia con ${candidate.nombre}`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={percent}
                      className="mt-2 flex items-center gap-3"
                    >
                      <span className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <span className="block h-full rounded-full bg-[#1e47c5]" style={{ width: `${percent}%` }} />
                      </span>
                      <span className="w-10 text-right text-sm font-medium text-slate-700 tabular-nums">{percent}%</span>
                    </div>
                    {candidate.apoyos.length > 0 && (
                      <ul aria-label="Hallazgos que lo apoyan" className="mt-2 flex flex-wrap gap-1.5">
                        {candidate.apoyos.map((apoyo) => (
                          <li key={apoyo} className="rounded-md bg-slate-100 px-2 py-0.5 text-sm text-slate-700">
                            {apoyo}
                          </li>
                        ))}
                      </ul>
                    )}
                    <button
                      type="button"
                      onClick={() => confirm(candidate.idEnfermedad, candidate.nombre)}
                      disabled={confirming !== null || isStale}
                      className="group mt-3 inline-flex items-center gap-2 rounded-lg border-2 border-teal-600 px-3.5 py-1.5 font-semibold text-teal-800 transition-colors hover:bg-teal-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {confirming === candidate.idEnfermedad ? 'Confirmando…' : 'Confirmar este diagnóstico'}
                      <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </li>
                );
              })}
            </ol>
          )}

          {result?.provisional && (
            <p className="flex items-start gap-2 rounded-lg bg-slate-100 px-3 py-2.5 text-sm text-slate-600">
              <FlaskConical aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
              Resultado de demostración ({result.motor}). Se reemplazará por la máquina de inferencia del equipo sin
              cambiar esta pantalla.
            </p>
          )}
          <p className="flex items-start gap-2 text-sm text-slate-600">
            <ShieldCheck aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
            Es una orientación; la decisión clínica es del médico tratante.
          </p>
        </div>

        <footer className="flex flex-wrap items-center justify-end gap-3 border-t-2 border-slate-100 px-5 py-3">
          {error && (
            <p role="alert" className="mr-auto flex items-center gap-2 text-red-700">
              <CircleAlert aria-hidden="true" className="h-4 w-4 shrink-0" />
              {error}
            </p>
          )}
          {!error && isUpToDate && (
            <p role="status" className="mr-auto flex items-center gap-2 text-slate-600">
              <CircleCheck aria-hidden="true" className="h-4 w-4 shrink-0 text-teal-700" />
              {justUpdated ? 'Análisis actualizado' : 'Análisis hecho'}
              {analyzedAt && ` a las ${new Date(analyzedAt).toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit' })}`}
              {' '}con los hallazgos guardados.
            </p>
          )}
          <button
            type="button"
            onClick={analyze}
            disabled={isRunning || isUpToDate}
            aria-busy={isRunning}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-teal-700 px-5 py-2 font-semibold text-white transition-colors hover:bg-teal-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-600"
          >
            {isUpToDate ? (
              <CircleCheck aria-hidden="true" className="h-5 w-5" />
            ) : (
              <Microscope aria-hidden="true" className="h-5 w-5" />
            )}
            {analyzeLabel}
          </button>
        </footer>
      </div>
    </section>
  );
}
