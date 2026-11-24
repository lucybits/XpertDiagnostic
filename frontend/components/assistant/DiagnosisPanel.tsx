'use client';

import { useEffect, useId, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, CircleAlert, CircleCheck, FileText, Microscope } from 'lucide-react';
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
  /** Diagnóstico ya confirmado y guardado en el expediente (PACIENTES), o null (P-135). */
  confirmedName: string | null;
};

/**
 * Último paso (P-103): analiza los hallazgos guardados con la máquina de inferencia registrada en
 * el backend y muestra el diagnóstico diferencial. Mientras el motor sea provisional lo dice
 * claramente. El médico confirma uno de los candidatos y pasa a la interfaz de salida (P-105).
 */
export default function DiagnosisPanel({
  patientId,
  result,
  isStale,
  onAnalyzed,
  onConfirmed,
  confirmedName,
}: DiagnosisPanelProps) {
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
      ? 'Generar diagnóstico y tratamiento'
      : isStale
        ? 'Guardar'
        : 'Análisis al día';

  return (
    <section
      aria-labelledby={`${ids}-title`}
      className="mx-auto w-full max-w-4xl px-4 pb-2 transition-[opacity,translate] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] starting:translate-y-2 starting:opacity-0 motion-reduce:transition-none sm:px-8"
    >
      <div className="rounded-2xl border-2 border-slate-200 bg-white">
        <header className="flex flex-wrap items-start gap-3 border-b-2 border-slate-100 px-5 pt-4 pb-3">
          <div className="min-w-0 flex-1">
            <h3 id={`${ids}-title`} className="text-lg font-semibold text-[#0b1533]">
              Diagnóstico diferencial
            </h3>
          </div>
          {result?.provisional && (
            <span className="rounded-md bg-amber-100 px-2 py-0.5 text-sm font-medium text-amber-900">
              Motor provisional
            </span>
          )}
        </header>

        <div className="space-y-3 px-5 py-4">
          {/* Diagnóstico ya confirmado (P-135): se dice cuál es, que ya está en el expediente y cómo verlo. */}
          {confirmedName && (
            <div
              role="status"
              className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl bg-slate-100 px-4 py-3"
            >
              <div className="flex min-w-0 flex-1 items-start gap-2 text-slate-900">
                <CircleCheck aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" />
                <div className="space-y-0.5">
                  <p>
                    <span className="font-semibold">{confirmedName}</span>: enviado a validación por el médico
                    internista.
                  </p>
                  {/* SIMULADO: todavía no existe la validación del comité; el texto se muestra siempre. */}
                  <p className="text-sm text-slate-700">
                    Con diagnóstico validado por el Comité de Interconsulta de Especialidad.
                  </p>
                </div>
              </div>
              <Link
                href={`/patients/${patientId}/result`}
                className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-teal-700 px-3.5 py-1.5 font-semibold text-white transition-colors hover:bg-teal-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
              >
                <FileText aria-hidden="true" className="h-4 w-4" />
                Ver resultado
              </Link>
            </div>
          )}
          {/* Análisis desactualizado (P-112): no se confirma con datos que ya cambiaron. */}
          {result && isStale && (
            <p role="status" className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-amber-900">
              <CircleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
              Los hallazgos cambiaron. Actualiza el expediente antes de confirmar.
            </p>
          )}
          {result === null ? null : result.candidatos.length === 0 ? (
            <p className="text-slate-800">Sin coincidencias. Revisa los hallazgos guardados.</p>
          ) : (
            <ol aria-label="Enfermedades candidatas" className="space-y-3">
              {result.candidatos.map((candidate, index) => {
                const percent = Math.round(candidate.puntaje * 100);
                const isConfirmed = candidate.nombre === confirmedName;
                return (
                  <li
                    key={candidate.idEnfermedad}
                    className={`rounded-xl border-2 px-4 py-3 transition-[opacity,translate] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] starting:translate-y-2 starting:opacity-0 motion-reduce:transition-none ${isConfirmed ? 'border-teal-700' : 'border-slate-100'}`}
                    style={{ transitionDelay: `${Math.min(index * 70, 210)}ms` }}
                  >
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="text-sm font-semibold text-slate-700 tabular-nums">{index + 1}.</span>
                      <span className="text-lg font-semibold text-slate-900">{candidate.nombre}</span>
                      {isConfirmed && (
                        <span className="inline-flex items-center gap-1 self-center rounded-md bg-teal-700 px-2 py-0.5 text-sm font-semibold text-white">
                          <CircleCheck aria-hidden="true" className="h-3.5 w-3.5" />
                          Confirmado
                        </span>
                      )}
                      <span className="text-sm text-slate-700 tabular-nums">
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
                        <span
                          className="block h-full rounded-full bg-[#1e47c5] transition-[width] duration-700 ease-out starting:w-0 motion-reduce:transition-none"
                          style={{ width: `${percent}%`, transitionDelay: `${120 + Math.min(index * 70, 210)}ms` }}
                        />
                      </span>
                      <span className="w-10 text-right text-sm font-medium text-slate-700 tabular-nums">{percent}%</span>
                    </div>
                    {candidate.apoyos.length > 0 && (
                      <ul aria-label="Hallazgos que lo apoyan" className="mt-2 flex flex-wrap gap-1.5">
                        {candidate.apoyos.map((apoyo, supportIndex) => (
                          <li
                            key={apoyo}
                            className="rounded-md bg-slate-100 px-2 py-0.5 text-sm text-slate-700 transition-[opacity,translate] duration-250 ease-out starting:translate-y-1 starting:opacity-0 motion-reduce:transition-none"
                            style={{ transitionDelay: `${Math.min(index * 70 + supportIndex * 25, 350)}ms` }}
                          >
                            {apoyo}
                          </li>
                        ))}
                      </ul>
                    )}
                    {/* El confirmado no repite el botón; con uno ya confirmado, los demás ofrecen cambiarlo
                        con un botón secundario para no competir con el confirmado (P-135). */}
                    {!isConfirmed && (
                      <button
                        type="button"
                        onClick={() => confirm(candidate.idEnfermedad, candidate.nombre)}
                        disabled={confirming !== null || isStale}
                        className={`group mt-3 inline-flex items-center gap-2 rounded-lg border-2 px-3.5 py-1.5 font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                          confirmedName
                            ? 'border-slate-300 bg-white text-slate-900 hover:border-slate-400 hover:bg-slate-50'
                            : 'border-teal-700 bg-teal-700 text-white hover:border-teal-800 hover:bg-teal-800'
                        }`}
                      >
                        {confirming === candidate.idEnfermedad
                          ? 'Confirmando…'
                          : confirmedName
                            ? 'Cambiar a este diagnóstico'
                            : 'Confirmar este diagnóstico'}
                        <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </button>
                    )}
                  </li>
                );
              })}
            </ol>
          )}

        </div>

        <footer className="flex flex-wrap items-center justify-end gap-3 border-t-2 border-slate-100 px-5 py-3">
          {error && (
            <p role="alert" className="mr-auto flex items-center gap-2 text-red-700">
              <CircleAlert aria-hidden="true" className="h-4 w-4 shrink-0" />
              {error}
            </p>
          )}
          {!error && isUpToDate && (
            <p role="status" className="mr-auto flex items-center gap-2 text-slate-800">
              <CircleCheck aria-hidden="true" className="h-4 w-4 shrink-0 text-teal-700" />
              {justUpdated ? 'Actualizado' : 'Analizado'}
              {analyzedAt && ` a las ${new Date(analyzedAt).toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit' })}`}
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
