'use client';

import { useId, useState } from 'react';
import { Check, CircleAlert } from 'lucide-react';
import { savePathological, saveNonPathological } from '@/services/historyService';
import {
  PATHOLOGICAL_FIELDS,
  PATHOLOGICAL_MAX_LENGTH,
  type PathologicalHistory,
  type PatientHistory,
} from '@/types/history';
import {
  EMPTY_NON_PATHOLOGICAL_HISTORY,
  NON_PATHOLOGICAL_QUESTIONS,
  type NonPathologicalHistory,
  type NonPathologicalKey,
} from '@/types/patient';
import { FOCUS_RING } from './styles';

type HistoryCaptureProps = {
  patientId: string;
  sectionLabel: string;
  kind: 'non-pathological' | 'pathological';
  /** Interrogatorio guardado (null mientras carga o si no hay paciente). */
  history: PatientHistory | null;
  /** Quedó guardado: HomeScreen marca la sección y pasa a la siguiente. */
  onSaved: (history: PatientHistory) => void;
};

const EMPTY_PATHOLOGICAL = Object.fromEntries(PATHOLOGICAL_FIELDS.map(({ key }) => [key, null])) as PathologicalHistory;

/**
 * Interrogatorio del paciente (P-159), primer paso de la captura del médico tratante.
 * - No patológicos: siete preguntas de sí o no (empiezan en "No").
 * - Patológicos: veintiún campos de texto libre; en blanco = sin antecedentes de ese tipo.
 * Se monta de nuevo al cambiar de sección o de paciente, así que lo guardado se lee una vez.
 */
export default function HistoryCapture({ patientId, sectionLabel, kind, history, onSaved }: HistoryCaptureProps) {
  const ids = useId();
  const [answers, setAnswers] = useState<NonPathologicalHistory>(
    () => history?.noPatologicos ?? EMPTY_NON_PATHOLOGICAL_HISTORY,
  );
  const [texts, setTexts] = useState<PathologicalHistory>(() => ({ ...EMPTY_PATHOLOGICAL, ...(history?.patologicos ?? {}) }));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (isSaving) return;
    setIsSaving(true);
    setError(null);
    const result =
      kind === 'non-pathological' ? await saveNonPathological(patientId, answers) : await savePathological(patientId, texts);
    setIsSaving(false);
    if (result.ok) onSaved(result.data);
    else setError(result.message);
  };

  const setAnswer = (key: NonPathologicalKey, value: boolean) => setAnswers((current) => ({ ...current, [key]: value }));

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
            {kind === 'non-pathological'
              ? 'Responda cada pregunta del interrogatorio.'
              : 'Describa los antecedentes de cada tipo. Deje en blanco los que no apliquen.'}
          </p>
        </header>

        {kind === 'non-pathological' ? (
          <ul className="divide-y-2 divide-slate-100">
            {NON_PATHOLOGICAL_QUESTIONS.map(({ key, label }) => (
              <li key={key} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-3">
                <span id={`${ids}-${key}`} className="text-slate-900">
                  {label}
                </span>
                <div role="radiogroup" aria-labelledby={`${ids}-${key}`} className="flex border-2 border-slate-300">
                  {[
                    { value: true, text: 'Sí' },
                    { value: false, text: 'No' },
                  ].map((option) => {
                    const checked = answers[key] === option.value;
                    return (
                      <button
                        key={option.text}
                        type="button"
                        role="radio"
                        aria-checked={checked}
                        onClick={() => setAnswer(key, option.value)}
                        className={`min-w-16 px-4 py-1.5 font-semibold transition-colors ${FOCUS_RING} ${
                          checked ? 'bg-[#0b1533] text-white' : 'bg-white text-slate-800 hover:bg-slate-100'
                        }`}
                      >
                        {option.text}
                      </button>
                    );
                  })}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="grid gap-x-6 gap-y-4 px-5 py-4 sm:grid-cols-2">
            {PATHOLOGICAL_FIELDS.map(({ key, label }) => (
              <div key={key}>
                <label htmlFor={`${ids}-${key}`} className="mb-1 block font-medium text-slate-900">
                  {label}
                </label>
                <input
                  id={`${ids}-${key}`}
                  type="text"
                  value={texts[key] ?? ''}
                  maxLength={PATHOLOGICAL_MAX_LENGTH}
                  autoComplete="off"
                  placeholder="Sin antecedentes"
                  onChange={(event) => setTexts((current) => ({ ...current, [key]: event.target.value }))}
                  className="w-full border-2 border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-500 focus:border-[#1e47c5] focus:outline-none"
                />
              </div>
            ))}
          </div>
        )}

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
