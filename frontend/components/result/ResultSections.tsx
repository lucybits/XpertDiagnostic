'use client';

import { useId, useState, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Check, CircleAlert, Pill } from 'lucide-react';
import { saveCarePlan, chooseTreatment } from '@/services/resultService';
import type { FindingType } from '@/types/record';
import { CARE_PLAN_LIMITS, type CarePlanInput, type PatientResult } from '@/types/result';

const FOCUS_RING = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#116ee6]/60';
const PRIMARY =
  'inline-flex min-h-11 items-center gap-2 rounded-xl bg-teal-700 px-5 py-2 font-semibold text-white transition-colors hover:bg-teal-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60';

/**
 * Tarjeta de la interfaz de salida (boceto de Lucía, P-105): logo a la izquierda y contenido en un
 * recuadro blanco. Al imprimir se conserva el contenido y desaparecen los controles.
 * Impresión (P-106): la tarjeta sí puede partirse entre hojas (si no, una tarjeta alta dejaba la
 * primera hoja vacía); lo que no se parte es cada grupo de datos, y el título no queda solo al final.
 */
export function ResultCard({ title, id, children }: { title: string; id: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex gap-4">
      <Image src="/logoxd.png" alt="" width={36} height={36} className="mt-1 h-9 w-9 shrink-0 object-contain print:hidden" />
      <div className="min-w-0 flex-1 rounded-2xl border-2 border-slate-200 bg-white px-5 py-4 print:border-slate-300">
        <h2 id={id} className="text-lg font-semibold text-[#0b1533] break-after-avoid">
          {title}
        </h2>
        <div className="mt-3">{children}</div>
      </div>
    </section>
  );
}

const HISTORY_GROUPS: readonly { type: FindingType; label: string }[] = [
  { type: 'Comorbilidad', label: 'Comorbilidades' },
  { type: 'Sintoma', label: 'Síntomas' },
  { type: 'Signo', label: 'Signos' },
  { type: 'Estudio_lab', label: 'Estudios de laboratorio' },
  { type: 'Estudio_diagdif', label: 'Estudios de diagnóstico diferencial' },
  { type: 'Complicacion', label: 'Complicaciones' },
];

/** 1. Historia clínica: las entradas capturadas (enfermedad preexistente y hallazgos). */
export function ClinicalHistoryCard({ result }: { result: PatientResult }) {
  const ids = useId();
  const { expediente } = result;
  return (
    <ResultCard title="Historia clínica" id={`${ids}-history`}>
      <dl className="space-y-3">
        <div className="break-inside-avoid">
          <dt className="font-medium text-slate-700">Enfermedad preexistente</dt>
          <dd className="text-slate-900">{expediente.enfermedadPreexistente ?? 'Ninguna registrada'}</dd>
        </div>
        {HISTORY_GROUPS.map(({ type, label }) => {
          const items = expediente.hallazgos.filter((h) => h.tipoHallazgo === type);
          if (items.length === 0 && (type === 'Estudio_diagdif' || type === 'Complicacion')) return null;
          return (
            <div key={type} className="break-inside-avoid">
              <dt className="font-medium text-slate-700">{label}</dt>
              <dd>
                {items.length === 0 ? (
                  <span className="text-slate-700">Sin registros</span>
                ) : (
                  <ul className="mt-1 flex flex-wrap gap-1.5">
                    {items.map((item) => (
                      <li key={item.idRegistro} className="rounded-md bg-slate-100 px-2 py-0.5 text-slate-800">
                        {item.descripcion}
                        {item.valor !== 'presente' && (
                          <span className="text-slate-700">
                            {' '}
                            | {item.valor}
                            {item.unidades ? ` ${item.unidades}` : ''}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </dd>
            </div>
          );
        })}
      </dl>
    </ResultCard>
  );
}

/** 2. Diagnóstico: la enfermedad que confirmó el médico (salida de PACIENTES). */
export function DiagnosisCard({ result }: { result: PatientResult }) {
  const ids = useId();
  return (
    <ResultCard title="Diagnóstico" id={`${ids}-diagnosis`}>
      {result.enfermedadDiagnosticada ? (
        <>
          <p className="text-2xl font-bold text-[#0b1533]">{result.enfermedadDiagnosticada}</p>
          <p className="mt-1 text-slate-800">Confirmado por el médico tratante a partir del diagnóstico diferencial.</p>
        </>
      ) : (
        <p className="text-slate-800">Aún no hay un diagnóstico confirmado.</p>
      )}
      <Link
        href={`/home?paciente=${result.paciente.idPaciente}`}
        className={`mt-3 inline-block rounded font-medium text-[#1e47c5] underline underline-offset-2 hover:text-[#0b1533] print:hidden ${FOCUS_RING}`}
      >
        {result.enfermedadDiagnosticada ? 'Revisar el análisis o cambiar el diagnóstico' : 'Ir a la captura para analizar'}
      </Link>
    </ResultCard>
  );
}

const formatDose = (min: number | null, max: number | null, units: string | null) => {
  if (min === null && max === null) return null;
  const range = min !== null && max !== null && min !== max ? `${min}–${max}` : String(min ?? max);
  return units ? `${range} ${units}` : range;
};

/** 3. Tratamiento: el médico elige el indicado entre los de la enfermedad (decisión de Lucía, P-105). */
export function TreatmentCard({ result, onSaved }: { result: PatientResult; onSaved: (result: PatientResult) => void }) {
  const ids = useId();
  const [choice, setChoice] = useState<string | null>(result.idTratamiento);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const chosen = result.tratamientos.find((t) => t.idTratamiento === result.idTratamiento) ?? null;

  const save = async () => {
    if (!choice) return;
    setIsSaving(true);
    setMessage(null);
    const response = await chooseTreatment(result.paciente.idPaciente, choice);
    setIsSaving(false);
    if (response.ok) {
      onSaved(response.data);
      setMessage({ ok: true, text: 'Tratamiento guardado.' });
    } else setMessage({ ok: false, text: response.message });
  };

  return (
    <ResultCard title="Tratamiento" id={`${ids}-treatment`}>
      {result.tratamientos.length === 0 ? (
        <p className="text-slate-800">Disponible cuando haya un diagnóstico confirmado.</p>
      ) : (
        <>
          {/* Impresión: solo el tratamiento indicado. */}
          <p className="hidden print:block">
            {chosen ? chosen.descripcion : 'Sin tratamiento indicado.'}
            {chosen && formatDose(chosen.dosisMinima, chosen.dosisMaxima, chosen.unidades)
              ? ` | ${formatDose(chosen.dosisMinima, chosen.dosisMaxima, chosen.unidades)}`
              : ''}
          </p>
          <div className="print:hidden">
            <p className="text-slate-800">Elige el tratamiento indicado para {result.enfermedadDiagnosticada}.</p>
            <ul role="radiogroup" aria-label="Tratamientos de la enfermedad" className="mt-3 max-h-80 space-y-1.5 overflow-y-auto pr-1">
              {result.tratamientos.map((treatment) => {
                const isChecked = choice === treatment.idTratamiento;
                const dose = formatDose(treatment.dosisMinima, treatment.dosisMaxima, treatment.unidades);
                return (
                  <li key={treatment.idTratamiento}>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={isChecked}
                      onClick={() => setChoice(treatment.idTratamiento)}
                      className={`flex w-full items-start gap-3 rounded-lg border-2 px-3 py-2 text-left transition-colors ${
                        isChecked ? 'border-teal-600 bg-teal-50' : 'border-slate-100 hover:bg-slate-50'
                      } ${FOCUS_RING}`}
                    >
                      <span
                        aria-hidden="true"
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                          isChecked ? 'border-teal-600 bg-teal-600 text-white' : 'border-slate-300'
                        }`}
                      >
                        {isChecked && <Check className="h-3.5 w-3.5" />}
                      </span>
                      <span className="min-w-0 flex-1 text-slate-900">
                        {treatment.descripcion}
                        {dose && <span className="block text-sm text-slate-700">Dosis: {dose}</span>}
                      </span>
                      {result.idTratamiento === treatment.idTratamiento && (
                        <span className="shrink-0 rounded-md bg-teal-100 px-1.5 py-0.5 text-xs font-medium text-teal-900">
                          Indicado
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
            <SaveRow
              message={message}
              button={
                <button
                  type="button"
                  onClick={save}
                  disabled={!choice || choice === result.idTratamiento || isSaving}
                  className={PRIMARY}
                >
                  <Pill aria-hidden="true" className="h-5 w-5" />
                  {isSaving ? 'Guardando…' : 'Guardar tratamiento'}
                </button>
              }
            />
          </div>
        </>
      )}
    </ResultCard>
  );
}

/** 4. Plan, expectativa (pronóstico) y seguimiento: lo escribe el médico (decisión de Lucía, P-105). */
export function CarePlanCard({ result, onSaved }: { result: PatientResult; onSaved: (result: PatientResult) => void }) {
  const ids = useId();
  const [plan, setPlan] = useState<CarePlanInput>({
    planIndicado: result.plan?.planIndicado ?? '',
    pronostico: result.plan?.pronostico ?? '',
    seguimiento: result.plan?.seguimiento ?? '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const tooShort = plan.planIndicado.trim().length < CARE_PLAN_LIMITS.planMin;

  const save = async () => {
    if (tooShort) {
      setMessage({ ok: false, text: 'Escribe el plan indicado (al menos 3 caracteres).' });
      return;
    }
    setIsSaving(true);
    setMessage(null);
    const response = await saveCarePlan(result.paciente.idPaciente, plan);
    setIsSaving(false);
    if (response.ok) {
      onSaved(response.data);
      setMessage({ ok: true, text: 'Plan guardado.' });
    } else setMessage({ ok: false, text: response.message });
  };

  const fields: { key: keyof CarePlanInput; label: string; max: number; rows: number; hint: string }[] = [
    { key: 'planIndicado', label: 'Plan indicado', max: CARE_PLAN_LIMITS.planMax, rows: 4, hint: 'Obligatorio' },
    { key: 'pronostico', label: 'Expectativa (pronóstico)', max: CARE_PLAN_LIMITS.pronosticoMax, rows: 2, hint: 'Opcional' },
    { key: 'seguimiento', label: 'Seguimiento', max: CARE_PLAN_LIMITS.seguimientoMax, rows: 2, hint: 'Opcional' },
  ];

  return (
    <ResultCard title="Plan, expectativa y seguimiento" id={`${ids}-plan`}>
      {/* Impresión: el texto guardado. */}
      <dl className="hidden space-y-2 print:block">
        {fields.map((field) => (
          <div key={field.key} className="break-inside-avoid">
            <dt className="font-medium">{field.label}</dt>
            <dd className="whitespace-pre-wrap">{plan[field.key] || '—'}</dd>
          </div>
        ))}
      </dl>
      <div className="space-y-4 print:hidden">
        {fields.map((field) => (
          <div key={field.key}>
            <label htmlFor={`${ids}-${field.key}`} className="mb-1 flex items-baseline justify-between gap-2">
              <span className="font-medium text-slate-700">{field.label}</span>
              <span className="text-sm text-slate-700 tabular-nums">
                {field.hint} | {plan[field.key].length}/{field.max}
              </span>
            </label>
            <textarea
              id={`${ids}-${field.key}`}
              rows={field.rows}
              maxLength={field.max}
              value={plan[field.key]}
              onChange={(event) => setPlan((current) => ({ ...current, [field.key]: event.target.value }))}
              className="w-full resize-y rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-base text-slate-900 transition-colors focus:border-[#116ee6] focus:outline-none"
            />
          </div>
        ))}
        <SaveRow
          message={message}
          button={
            <button type="button" onClick={save} disabled={isSaving} className={PRIMARY}>
              <Check aria-hidden="true" className="h-5 w-5" />
              {isSaving ? 'Guardando…' : 'Guardar plan'}
            </button>
          }
        />
      </div>
    </ResultCard>
  );
}

function SaveRow({ message, button }: { message: { ok: boolean; text: string } | null; button: ReactNode }) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
      {message && (
        <p
          role={message.ok ? 'status' : 'alert'}
          className={`mr-auto flex items-center gap-2 ${message.ok ? 'text-teal-800' : 'text-red-700'}`}
        >
          {message.ok ? <Check aria-hidden="true" className="h-4 w-4" /> : <CircleAlert aria-hidden="true" className="h-4 w-4" />}
          {message.text}
        </p>
      )}
      {button}
    </div>
  );
}
