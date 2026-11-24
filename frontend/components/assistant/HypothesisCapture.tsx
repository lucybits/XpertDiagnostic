'use client';

import { useId, useState } from 'react';
import { Check, CircleAlert } from 'lucide-react';
import { HYPOTHESIS_LIMITS, validateHypothesis } from '@/lib/recordRules';
import { saveHypothesis } from '@/services/recordService';
import type { PatientRecord } from '@/types/record';

type HypothesisCaptureProps = {
  patientId: string;
  sectionLabel: string;
  record: PatientRecord | null;
  /** El expediente quedó guardado: HomeScreen marca la sección y pasa al análisis. */
  onSaved: (record: PatientRecord) => void;
};

/**
 * Hipótesis diagnóstica inicial del médico tratante (P-145): lo que sospecha después del interrogatorio
 * y la exploración, antes de pedirle al sistema el diagnóstico diferencial. Se guarda en el expediente
 * para que el internista la compare con el resultado al validar.
 */
export default function HypothesisCapture({ patientId, sectionLabel, record, onSaved }: HypothesisCaptureProps) {
  const ids = useId();
  const [text, setText] = useState(record?.hipotesisInicial ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (isSaving) return;
    const validation = validateHypothesis(text);
    if (!validation.ok) {
      setError(validation.message);
      document.getElementById(`${ids}-text`)?.focus();
      return;
    }
    setIsSaving(true);
    setError(null);
    const result = await saveHypothesis(patientId, validation.text);
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
        </header>

        <div className="p-4">
          <label htmlFor={`${ids}-text`} className="mb-1.5 block font-medium text-slate-700">
            ¿Qué sospechas con lo que interrogaste y exploraste?
          </label>
          <textarea
            id={`${ids}-text`}
            value={text}
            rows={4}
            maxLength={HYPOTHESIS_LIMITS.max}
            onChange={(event) => {
              setText(event.target.value);
              setError(null);
            }}
            aria-invalid={error ? true : undefined}
            aria-describedby={`${ids}-hint${error ? ` ${ids}-error` : ''}`}
            placeholder="Por ejemplo: probable asma bronquial; descartar neumonía."
            className={`w-full resize-y rounded-lg border-2 bg-white px-3 py-2.5 text-base text-slate-900 focus:outline-none ${
              error ? 'border-red-600' : 'border-slate-200 focus:border-[#116ee6]'
            }`}
          />
          <p id={`${ids}-hint`} className="mt-1 text-sm text-slate-700">
            El internista la verá junto al diagnóstico del sistema al validarlo. {text.length}/{HYPOTHESIS_LIMITS.max}
          </p>
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
