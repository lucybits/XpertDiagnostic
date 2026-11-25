'use client';

import { useEffect, useId, useState } from 'react';
import { CircleAlert, CircleCheck, Hourglass, Microscope, Pill, Send } from 'lucide-react';
import { analyzePatient } from '@/services/recordService';
import { getValidationStatus, sendToValidation } from '@/services/validationService';
import type { DiagnosisResult } from '@/types/record';
import { formatValidationDate, VALIDATION_STATES, type ValidationSummary } from '@/types/validation';

type DiagnosisPanelProps = {
  patientId: string;
  result: DiagnosisResult | null;
  /** Los hallazgos cambiaron después de este análisis: hay que volver a analizar (P-112). */
  isStale: boolean;
  /** Llega el resultado: HomeScreen lo guarda para el expediente y marca la sección. */
  onAnalyzed: (result: DiagnosisResult) => void;
  /** Cambió el estado de la validación (se envió o llegó la confirmación): HomeScreen lo anota en el paciente. */
  onValidationChanged: (summary: ValidationSummary) => void;
};

/**
 * Último paso (P-103): analiza los hallazgos guardados con la máquina de inferencia registrada en
 * el backend y muestra el diagnóstico diferencial. Mientras el motor sea provisional lo dice
 * claramente. El médico tratante no confirma: envía el diagnóstico diferencial al médico internista,
 * que confirma uno de los candidatos (P-151). Aquí se ve si está en validación o ya confirmado.
 */
export default function DiagnosisPanel({ patientId, result, isStale, onAnalyzed, onValidationChanged }: DiagnosisPanelProps) {
  const ids = useId();
  const [isRunning, setIsRunning] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Estado de la validación, leído del servidor al abrir el paso (así llega la confirmación del internista).
  const [validation, setValidation] = useState<ValidationSummary | null>(null);
  // Hora del último análisis hecho aquí y aviso breve de "actualizado" (P-114).
  const [analyzedAt, setAnalyzedAt] = useState<number | null>(null);
  const [justUpdated, setJustUpdated] = useState(false);

  useEffect(() => {
    let isActive = true;
    void getValidationStatus(patientId).then((response) => {
      if (!isActive || !response.ok) return;
      setValidation(response.data);
      onValidationChanged(response.data);
    });
    return () => {
      isActive = false;
    };
    // Solo al abrir el paso o cambiar de paciente; onValidationChanged cambia en cada render de HomeScreen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

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

  // El tratante envía el diagnóstico diferencial al internista (P-151), o se lo vuelve a enviar si no está
  // de acuerdo con lo que confirmó. El servidor calcula los candidatos con los hallazgos actuales.
  const send = async () => {
    setIsSending(true);
    setError(null);
    const response = await sendToValidation(patientId);
    setIsSending(false);
    if (response.ok) {
      setValidation(response.data);
      onValidationChanged(response.data);
    } else setError(response.message);
  };

  const state = validation?.estado ?? null;
  const isPending = state === VALIDATION_STATES.pending;
  const isConfirmed = state === VALIDATION_STATES.confirmed;
  const hasCandidates = result !== null && result.candidatos.length > 0;
  // Primer envío (pie): un análisis al día, con candidatos, de un paciente que aún no se envía. Reenviar lo
  // ya confirmado se hace desde el aviso verde; mientras espera, el aviso dice "Enviado".
  const canSend = hasCandidates && !isStale && state === null;

  // Botón de análisis (P-114): solo aparece cuando hay algo que calcular, es decir, sin análisis o con
  // hallazgos que cambiaron. Con el análisis al día no hay nada que recalcular (el motor da lo mismo con
  // los mismos hallazgos), así que se oculta; el pie dice cuándo se analizó.
  const isUpToDate = result !== null && !isStale;
  const analyzeLabel = isRunning ? 'Analizando…' : result === null ? 'Generar diagnóstico y tratamiento' : 'Guardar';

  const sentAt = formatValidationDate(validation?.fechaSolicitud ?? null);
  const confirmedAt = formatValidationDate(validation?.fechaValidacion ?? null);

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
          {/* En validación (P-151): el tratante ya lo envió y espera al internista. */}
          {isPending && (
            <div role="status" className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl bg-slate-100 px-4 py-3 text-slate-900">
              <div className="flex min-w-0 flex-1 items-start gap-2">
                <Hourglass aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-[#1e47c5]" />
                <div className="space-y-0.5">
                  <p className="font-semibold">Enviado a validación del médico internista.</p>
                  <p className="text-sm text-slate-700">
                    En espera de su confirmación{sentAt ? `. Enviado el ${sentAt}` : '.'}
                  </p>
                </div>
              </div>
              {/* El botón de reenviar queda como "Enviado" mientras el internista no responde. */}
              <button
                type="button"
                disabled
                className="inline-flex shrink-0 cursor-not-allowed items-center gap-2 rounded-lg bg-slate-200 px-3.5 py-2 text-sm font-semibold text-slate-600"
              >
                <CircleCheck aria-hidden="true" className="h-4 w-4" />
                Enviado
              </button>
            </div>
          )}
          {/* Confirmado (P-151): el internista eligió el diagnóstico. Si el tratante no está de acuerdo, se lo
              vuelve a enviar; así puede hacerlo cada vez que el internista confirme o cambie el diagnóstico. */}
          {isConfirmed && validation?.diagnostico && (
            <div role="status" className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl bg-teal-50 px-4 py-3 text-slate-900">
              <div className="flex min-w-0 flex-1 items-start gap-2">
                <CircleCheck aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" />
                {/* La fecha y hora de la confirmación van en el pie, no aquí. */}
                <p>
                  <span className="font-semibold">{validation.diagnostico}</span>: confirmado por el médico internista
                  {validation.validador ? ` ${validation.validador}` : ''}.
                </p>
              </div>
              <button
                type="button"
                onClick={send}
                disabled={isSending}
                aria-busy={isSending}
                className="inline-flex shrink-0 items-center gap-2 rounded-lg border-2 border-teal-700 bg-white px-3.5 py-2 text-sm font-semibold text-teal-800 transition-colors hover:bg-teal-700 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send aria-hidden="true" className="h-4 w-4" />
                {isSending ? 'Enviando…' : 'Volver a enviar al internista'}
              </button>
            </div>
          )}
          {/* Análisis desactualizado (P-112): no se envía con datos que ya cambiaron. */}
          {result && isStale && (
            <p role="status" className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-black">
              <CircleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-black" />
              Los hallazgos cambiaron. Actualiza el expediente antes de enviarlo al médico internista.
            </p>
          )}
          {result === null ? null : result.candidatos.length === 0 ? (
            <p className="text-slate-800">Sin coincidencias. Revisa los hallazgos guardados.</p>
          ) : (
            <ol aria-label="Enfermedades candidatas" className="space-y-3">
              {result.candidatos.map((candidate, index) => {
                const percent = Math.round(candidate.puntaje * 100);
                const isChosen = isConfirmed && candidate.nombre === validation?.diagnostico;
                return (
                  <li
                    key={candidate.idEnfermedad}
                    className={`rounded-xl border-2 px-4 py-3 transition-[opacity,translate] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] starting:translate-y-2 starting:opacity-0 motion-reduce:transition-none ${isChosen ? 'border-teal-700' : 'border-slate-100'}`}
                    style={{ transitionDelay: `${Math.min(index * 70, 210)}ms` }}
                  >
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="text-sm font-semibold text-slate-700 tabular-nums">{index + 1}.</span>
                      <span className="text-lg font-semibold text-slate-900">{candidate.nombre}</span>
                      {isChosen && (
                        <span className="inline-flex items-center gap-1 self-center rounded-md bg-teal-700 px-2 py-0.5 text-sm font-semibold text-white">
                          <CircleCheck aria-hidden="true" className="h-3.5 w-3.5" />
                          Confirmado por el internista
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
                      <span className="h-2 flex-1 overflow-hidden rounded-none bg-slate-100">
                        <span
                          className="block h-full rounded-none bg-[#1e47c5] transition-[width] duration-700 ease-out starting:w-0 motion-reduce:transition-none"
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
                    {/* Primer tratamiento de la enfermedad en la base de conocimiento (P-160). */}
                    {candidate.tratamientoSugerido && (
                      <p className="mt-2 flex items-start gap-1.5 text-sm text-slate-800">
                        <Pill aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
                        <span>
                          <span className="font-medium">Tratamiento sugerido:</span> {candidate.tratamientoSugerido}
                        </span>
                      </p>
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
          {/* Ya confirmado: la hora que importa es la de la confirmación del internista. Antes de eso,
              la del último análisis hecho aquí (P-114). */}
          {!error && isConfirmed && confirmedAt ? (
            <p role="status" className="mr-auto flex items-center gap-2 text-slate-800">
              <CircleCheck aria-hidden="true" className="h-4 w-4 shrink-0 text-teal-700" />
              Confirmado el {confirmedAt}
            </p>
          ) : (
            !error &&
            isUpToDate && (
              <p role="status" className="mr-auto flex items-center gap-2 text-slate-800">
                <CircleCheck aria-hidden="true" className="h-4 w-4 shrink-0 text-teal-700" />
                {justUpdated ? 'Actualizado' : 'Analizado'}
                {analyzedAt && ` a las ${new Date(analyzedAt).toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit' })}`}
              </p>
            )
          )}
          {!isUpToDate && (
            <button
              type="button"
              onClick={analyze}
              disabled={isRunning}
              aria-busy={isRunning}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-teal-700 px-5 py-2 font-semibold text-white transition-colors hover:bg-teal-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Microscope aria-hidden="true" className="h-5 w-5" />
              {analyzeLabel}
            </button>
          )}
          {canSend && (
            <button
              type="button"
              onClick={send}
              disabled={isSending}
              aria-busy={isSending}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-teal-700 px-5 py-2 font-semibold text-white transition-colors hover:bg-teal-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send aria-hidden="true" className="h-5 w-5" />
              {isSending ? 'Enviando…' : 'Enviar al médico internista'}
            </button>
          )}
        </footer>
      </div>
    </section>
  );
}
