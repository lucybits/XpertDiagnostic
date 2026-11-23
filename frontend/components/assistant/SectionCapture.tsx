'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import { Check, CircleAlert, Search, X } from 'lucide-react';
import LoadingDots from '@/components/ui/LoadingDots';
import type { SectionCapture as SectionCaptureConfig } from '@/components/home/clinicalSections';
import { filterOptions, normalizeMeasure, toCatalogOptions, type CatalogOption } from '@/lib/recordRules';
import { getCatalog } from '@/services/catalogService';
import { saveFindings, setPreexistingDisease } from '@/services/recordService';
import type { PatientRecord } from '@/types/record';
import { FOCUS_RING } from './styles';

type CaptureConfig = Exclude<SectionCaptureConfig, { kind: 'analysis' }>;

type SectionCaptureProps = {
  patientId: string;
  sectionLabel: string;
  capture: CaptureConfig;
  record: PatientRecord | null;
  /** El expediente quedó guardado: HomeScreen marca la sección y pasa a la siguiente. */
  onSaved: (record: PatientRecord) => void;
};

const MAX_VISIBLE = 60;

/**
 * Captura estructurada de una sección (P-103): el médico busca en el catálogo de la base de
 * conocimiento, marca lo que presenta el paciente y, si se puede medir, escribe el valor.
 * Cada opción representa una descripción aunque el catálogo la tenga en varias enfermedades; el
 * servidor guarda todos sus IDs equivalentes.
 */
export default function SectionCapture({ patientId, sectionLabel, capture, record, onSaved }: SectionCaptureProps) {
  const ids = useId();
  const [options, setOptions] = useState<CatalogOption[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState('');
  // Elegidos: id representativo → medición escrita ('' = presente).
  const [selected, setSelected] = useState<ReadonlyMap<string, string>>(new Map());
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isSingle = capture.kind === 'preexisting';

  // Carga el catálogo y marca lo que ya estaba guardado.
  useEffect(() => {
    let active = true;
    void getCatalog(capture.catalog).then((items) => {
      if (!active) return;
      if (!items) {
        setLoadError(true);
        return;
      }
      const loaded = toCatalogOptions(items);
      setOptions(loaded);
      if (!record) return;
      const initial = new Map<string, string>();
      if (capture.kind === 'preexisting') {
        const match = loaded.find((o) => o.id === record.idEnfermedadPreexistente);
        if (match) initial.set(match.id, '');
      } else {
        for (const finding of record.hallazgos.filter((h) => h.tipoHallazgo === capture.findingType)) {
          const match = loaded.find((o) => o.label.toLowerCase() === finding.descripcion.trim().toLowerCase());
          if (match) initial.set(match.id, finding.valor === 'presente' ? '' : finding.valor);
        }
      }
      setSelected(initial);
    });
    return () => {
      active = false;
    };
    // El catálogo y lo guardado se leen una vez por sección (el chat se monta de nuevo al cambiarla).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visible = useMemo(() => (options ? filterOptions(options, query) : []), [options, query]);
  const byId = useMemo(() => new Map((options ?? []).map((o) => [o.id, o])), [options]);
  const invalidMeasures = [...selected].filter(([, value]) => normalizeMeasure(value) === undefined).map(([id]) => id);

  const toggle = (option: CatalogOption) => {
    setError(null);
    setSelected((current) => {
      if (isSingle) return current.has(option.id) ? new Map() : new Map([[option.id, '']]);
      const next = new Map(current);
      if (next.has(option.id)) next.delete(option.id);
      else next.set(option.id, '');
      return next;
    });
  };

  const setMeasure = (id: string, value: string) =>
    setSelected((current) => new Map(current).set(id, value));

  const save = async () => {
    if (isSaving || invalidMeasures.length > 0) return;
    setIsSaving(true);
    setError(null);
    const result =
      capture.kind === 'preexisting'
        ? await setPreexistingDisease(patientId, [...selected.keys()][0] ?? null)
        : await saveFindings(
            patientId,
            capture.section,
            [...selected].map(([idRegistro, value]) => ({ idRegistro, valor: normalizeMeasure(value) ?? null })),
          );
    setIsSaving(false);
    if (result.ok) onSaved(result.data);
    else setError(result.message);
  };

  const noun = capture.kind === 'preexisting' ? 'enfermedad preexistente' : capture.noun;
  const saveLabel =
    selected.size === 0
      ? capture.kind === 'preexisting'
        ? 'Continuar sin enfermedad preexistente'
        : `Continuar sin ${capture.noun}`
      : 'Guardar y continuar';

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

        {options === null ? (
          <div role="status" className="flex items-center justify-center gap-3 px-5 py-10 text-slate-800">
            {loadError ? (
              <span className="flex items-center gap-2 text-red-700">
                <CircleAlert aria-hidden="true" className="h-5 w-5" />
                No se pudo cargar el catálogo.
              </span>
            ) : (
              <>
                <LoadingDots label={null} />
                <span>Cargando…</span>
              </>
            )}
          </div>
        ) : (
          <div className="grid gap-0 md:grid-cols-[1fr_1fr]">
            {/* Catálogo con búsqueda */}
            <div className="border-slate-100 p-4 md:border-r-2">
              <label htmlFor={`${ids}-search`} className="sr-only">
                Buscar {noun}
              </label>
              <div className="relative">
                <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-600" />
                <input
                  id={`${ids}-search`}
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={`Buscar ${noun}…`}
                  autoComplete="off"
                  className="w-full rounded-lg border-2 border-slate-200 bg-white py-2 pr-3 pl-9 text-base text-slate-900 transition-colors focus:border-[#116ee6] focus:outline-none"
                />
              </div>
              <ul
                aria-label={`Catálogo de ${noun}`}
                className="mt-3 max-h-64 space-y-1 overflow-y-auto pr-1 scrollbar-thin"
              >
                {visible.slice(0, MAX_VISIBLE).map((option) => {
                  const isChecked = selected.has(option.id);
                  return (
                    <li key={option.id}>
                      <button
                        type="button"
                        role={isSingle ? 'radio' : 'checkbox'}
                        aria-checked={isChecked}
                        onClick={() => toggle(option)}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                          isChecked ? 'bg-teal-50 text-slate-900' : 'text-slate-700 hover:bg-slate-50'
                        } ${FOCUS_RING}`}
                      >
                        <span
                          aria-hidden="true"
                          className={`flex h-5 w-5 shrink-0 items-center justify-center border-2 ${
                            isSingle ? 'rounded-full' : 'rounded-md'
                          } ${isChecked ? 'border-teal-600 bg-teal-600 text-white' : 'border-slate-300 bg-white'}`}
                        >
                          {isChecked && <Check className="h-3.5 w-3.5" />}
                        </span>
                        <span className="min-w-0 flex-1">{option.label}</span>
                        {option.units && <span className="shrink-0 text-sm text-slate-600">{option.units}</span>}
                      </button>
                    </li>
                  );
                })}
                {visible.length === 0 && <li className="px-3 py-6 text-center text-slate-700">Sin coincidencias.</li>}
                {visible.length > MAX_VISIBLE && (
                  <li className="px-3 py-2 text-center text-sm text-slate-700">
                    {visible.length - MAX_VISIBLE} más. Escribe para filtrar.
                  </li>
                )}
              </ul>
            </div>

            {/* Elegidos */}
            <div className="border-t-2 border-slate-100 p-4 md:border-t-0">
              <p className="font-medium text-slate-700">
                {isSingle ? 'Seleccionada' : `Seleccionados (${selected.size})`}
              </p>
              {selected.size === 0 ? (
                <p className="mt-2 text-slate-700">Sin selección.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {[...selected].map(([id, value]) => {
                    const option = byId.get(id);
                    if (!option) return null;
                    const isInvalid = invalidMeasures.includes(id);
                    return (
                      <li key={id} className="rounded-lg bg-slate-50 px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="min-w-0 flex-1 font-medium text-slate-900">{option.label}</span>
                          <button
                            type="button"
                            onClick={() => toggle(option)}
                            aria-label={`Quitar ${option.label}`}
                            className={`rounded-md p-1 text-slate-600 hover:bg-slate-200 hover:text-slate-700 ${FOCUS_RING}`}
                          >
                            <X aria-hidden="true" className="h-4 w-4" />
                          </button>
                        </div>
                        {option.units && (
                          <div className="mt-1.5 flex items-center gap-2">
                            <label htmlFor={`${ids}-${id}`} className="text-sm text-slate-800">
                              Valor
                            </label>
                            <input
                              id={`${ids}-${id}`}
                              type="text"
                              inputMode="decimal"
                              value={value}
                              onChange={(event) => setMeasure(id, event.target.value)}
                              placeholder="opcional"
                              aria-invalid={isInvalid || undefined}
                              className={`w-24 rounded-md border-2 bg-white px-2 py-1 text-base tabular-nums focus:outline-none ${
                                isInvalid ? 'border-red-600' : 'border-slate-200 focus:border-[#116ee6]'
                              }`}
                            />
                            <span className="text-sm text-slate-700">{option.units}</span>
                          </div>
                        )}
                        {isInvalid && <p className="mt-1 text-sm text-red-700">Solo números, p. ej. 38.5</p>}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
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
            disabled={options === null || isSaving || invalidMeasures.length > 0}
            aria-busy={isSaving}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-teal-700 px-5 py-2 font-semibold text-white transition-colors hover:bg-teal-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Check aria-hidden="true" className="h-5 w-5" />
            {isSaving ? 'Guardando…' : saveLabel}
          </button>
        </footer>
      </div>
    </section>
  );
}
