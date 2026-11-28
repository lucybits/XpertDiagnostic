'use client';

import { useId, useState } from 'react';
import { Check, CircleAlert } from 'lucide-react';
import { HYPOTHESIS_LIMITS, validateHypothesis } from '@/lib/recordRules';
import { saveHypothesis } from '@/services/recordService';
import type { PatientRecord } from '@/types/record';

type HypothesisCaptureProps = {
  patientId: string;
  sectionLabel: string;
  /** Expediente del paciente (null mientras carga). */
  record: PatientRecord | null;
  /** Quedó guardada: HomeScreen marca la sección y pasa a la siguiente. */
  onSaved: (record: PatientRecord) => void;
};

/**
 * Hipótesis diagnóstica inicial (P-167): la escribe el médico tratante después del interrogatorio y
 * antes de capturar signos y síntomas. Es su impresión clínica; no entra a la máquina de inferencia.
 * Se monta de nuevo al cambiar de sección o de paciente, así que lo guardado se lee una vez.
 */
export default function HypothesisCapture({ patientId, sectionLabel, record, onSaved }: HypothesisCaptureProps) {
  const ids = useId();
  const [text, setText] = useState(() => record?.hipotesisInicial ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (isSaving) return;
    const checked = validateHypothesis(text);
    if (!checked.ok) {
      setError(checked.message);
      return;
    }
    setIsSaving(true);
    setError(null);
    const result = await saveHypothesis(patientId, checked.text);
    setIsSaving(false);
    if (result.ok) onSaved(result.data);
    else setError(result.message);
  };

  return (
    <section
      aria-labelledby={`${ids}-title`}
      className="mx-auto w-full max-w-4xl px-4 pb-2 transition-opacity duration-300 starting:opacity-0 motion-reduce:transition-none sm:px-8"
    >
      <div className="rounded-2xl border-2 border-slate-200 bg-white">
        <header className="border-b-2 border-slate-100 px-5 pt-4 pb-3">
          <h3 id={`${ids}-title`} className="text-lg font-semibold text-[#0b1533]">
            {sectionLabel}
          </h3>
          <p className="text-sm text-slate-700">
            Escriba su impresión diagnóstica con lo obtenido en el interrogatorio, antes de registrar signos y síntomas.
          </p>
        </header>

        <div className="px-5 py-4">
          <label htmlFor={`${ids}-text`} className="mb-1 flex items-baseline justify-between gap-2">
            <span className="font-medium text-slate-900">Hipótesis diagnóstica</span>
            <span className="text-sm text-slate-700 tabular-nums">
              {text.length}/{HYPOTHESIS_LIMITS.max}
            </span>
          </label>
          <textarea
            id={`${ids}-text`}
            rows={5}
            value={text}
            maxLength={HYPOTHESIS_LIMITS.max}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${ids}-error` : undefined}
            placeholder="Por ejemplo: probable asma bronquial descompensada"
            onChange={(event) => setText(event.target.value)}
            className="w-full resize-y border-2 border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-500 focus:border-[#1e47c5] focus:outline-none"
          />
        </div>

        <footer className="flex flex-wrap items-center justify-end gap-3 border-t-2 border-slate-100 px-5 py-3">
          {error && (
            <p id={`${ids}-error`} role="alert" className="mr-auto flex items-center gap-2 text-red-700">
              <CircleAlert aria-hidden="true" className="h-4 w-4 shrink-0" />
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={save}
            disabled={isSaving}
            aria-busy={isSaving}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-teal-700 px-5 py-2 font-semibold text-white transition-colors hover:bg-teal-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Check aria-hidden="true" className="h-5 w-5" />
            {isSaving ? 'Guardando…' : 'Guardar y continuar'}
          </button>
        </footer>
      </div>
    </section>
  );
}
