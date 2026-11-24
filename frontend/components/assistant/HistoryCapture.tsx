'use client';

import { useId, useState } from 'react';
import { Check, CircleAlert } from 'lucide-react';
import { saveNonPathologicalHistory } from '@/services/recordService';
import {
  EMPTY_NON_PATHOLOGICAL_HISTORY,
  NON_PATHOLOGICAL_QUESTIONS,
  type NonPathologicalHistory,
  type NonPathologicalKey,
} from '@/types/patient';
import type { PatientRecord } from '@/types/record';
import { FOCUS_RING } from './styles';

type HistoryCaptureProps = {
  patientId: string;
  sectionLabel: string;
  record: PatientRecord | null;
  /** El expediente quedó guardado: HomeScreen marca la sección y pasa a la siguiente. */
  onSaved: (record: PatientRecord) => void;
};

/**
 * Interrogatorio del médico tratante (P-145): antecedentes no patológicos como casillas sí/no.
 * Sin marcar cuenta como "no". Se guardan en IO_AntecNoPatolPacientes.
 */
export default function HistoryCapture({ patientId, sectionLabel, record, onSaved }: HistoryCaptureProps) {
  const ids = useId();
  // Lo guardado antes, si ya se hizo el interrogatorio; si no, todo en "no".
  const [answers, setAnswers] = useState<NonPathologicalHistory>(
    () => record?.antecedentesNoPatologicos ?? EMPTY_NON_PATHOLOGICAL_HISTORY,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (key: NonPathologicalKey) => {
    setError(null);
    setAnswers((current) => ({ ...current, [key]: !current[key] }));
  };

  const save = async () => {
    if (isSaving) return;
    setIsSaving(true);
    setError(null);
    const result = await saveNonPathologicalHistory(patientId, answers);
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
          <p id={`${ids}-hint`} className="mt-0.5 text-slate-700">
            Pregunta al paciente y marca las que apliquen; sin marcar cuenta como &ldquo;no&rdquo;.
          </p>
        </header>

        <ul aria-describedby={`${ids}-hint`} className="grid gap-1 p-4 sm:grid-cols-2">
          {NON_PATHOLOGICAL_QUESTIONS.map(({ key, label }) => {
            const isChecked = answers[key];
            return (
              <li key={key}>
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={isChecked}
                  onClick={() => toggle(key)}
                  className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                    isChecked ? 'bg-teal-50 text-slate-900' : 'text-slate-700 hover:bg-slate-50'
                  } ${FOCUS_RING}`}
                >
                  <span
                    aria-hidden="true"
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ${
                      isChecked ? 'border-teal-600 bg-teal-600 text-white' : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isChecked && <Check className="h-3.5 w-3.5" />}
                  </span>
                  <span className="min-w-0 flex-1 leading-snug">{label}</span>
                </button>
              </li>
            );
          })}
        </ul>

        <footer className="flex flex-wrap items-center justify-end gap-3 border-t-2 border-slate-100 px-5 py-3">
          {error && (
            <p role="alert" className="mr-auto flex items-center gap-2 text-red-700">
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
