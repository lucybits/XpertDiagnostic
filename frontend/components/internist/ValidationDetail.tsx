'use client';

import { useState, type ReactNode } from 'react';
import {
  CalendarCheck,
  CalendarClock,
  Check,
  CircleAlert,
  CircleCheck,
  ClipboardList,
  Hourglass,
  RefreshCcw,
  Stethoscope,
  UserRound,
  X,
} from 'lucide-react';
import { FINDING_GROUPS } from '@/types/record';
import { formatValidationDate, VALIDATION_STATES, type ValidationDetail as Detail } from '@/types/validation';

/** Estilos compartidos de la pantalla del internista. */
export const FOCUS = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2';
export const BUTTON = `inline-flex items-center justify-center gap-2 rounded-lg border-2 border-slate-400 bg-white px-3.5 py-2 text-sm font-semibold text-slate-900 transition-colors hover:border-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS}`;
export const BUTTON_PRIMARY = `inline-flex items-center justify-center gap-2 rounded-lg border-2 border-[#0b1533] bg-[#0b1533] px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:border-blue-900 hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS}`;
export const BUTTON_SUCCESS = `inline-flex items-center justify-center gap-2 rounded-lg border-2 border-teal-700 bg-teal-700 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:border-teal-800 hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS}`;

type ValidationDetailProps = {
  detail: Detail;
  /** Confirma (o corrige, P-153) un candidato. @post null si se guardó; si no, el mensaje de error. */
  onConfirm: (diseaseId: string) => Promise<string | null>;
};

const SEX_LABEL: Record<string, string> = { F: 'Femenino', M: 'Masculino' };

/** Azul marino del sidebar del tratante: bloques oscuros con texto blanco. */
export const NAVY = 'bg-[#0b1533]';

/** Estado de la validación: texto de color con ícono, sin fondo (no píldora). `onDark` para fondos oscuros. */
export function StatusText({ state, onDark = false }: { state: string | null; onDark?: boolean }) {
  if (state === VALIDATION_STATES.pending)
    return (
      <span className={`inline-flex items-center gap-1.5 text-sm font-semibold ${onDark ? 'text-amber-300' : 'text-amber-800'}`}>
        <Hourglass aria-hidden="true" className="h-4 w-4" />
        Pendiente de validación
      </span>
    );
  if (state === VALIDATION_STATES.confirmed)
    return (
      <span className={`inline-flex items-center gap-1.5 text-sm font-semibold ${onDark ? 'text-teal-300' : 'text-teal-700'}`}>
        <CircleCheck aria-hidden="true" className="h-4 w-4" />
        Confirmado
      </span>
    );
  return <span className={`text-sm font-semibold ${onDark ? 'text-white/90' : 'text-slate-700'}`}>Sin enviar</span>;
}

/** Dato del resumen con ícono: etiqueta pequeña arriba y valor abajo. */
function Field({ icon: Icon, label, children }: { icon: typeof UserRound; label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <Icon aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[#0b1533]" />
      <div>
        <dt className="text-sm text-slate-700">{label}</dt>
        <dd className="font-semibold text-slate-900">{children}</dd>
      </div>
    </div>
  );
}

/** Título de sección con ícono sobre cuadro azul marino. */
function SectionTitle({ id, icon: Icon, title, subtitle }: { id: string; icon: typeof UserRound; title: string; subtitle: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${NAVY} text-white`}>
        <Icon aria-hidden="true" className="h-5 w-5" />
      </span>
      <div>
        <h3 id={id} className="text-lg font-bold text-slate-900">
          {title}
        </h3>
        <p className="text-sm text-slate-700">{subtitle}</p>
      </div>
    </div>
  );
}

/**
 * Expediente que revisa el médico internista (P-151). A la izquierda, el resumen del paciente y de la
 * solicitud; a la derecha, los hallazgos y el diagnóstico diferencial. Confirmar pide un segundo clic
 * para evitar errores de dedo; ya confirmado, los demás candidatos permiten corregirlo (P-153).
 */
export default function ValidationDetail({ detail, onConfirm }: ValidationDetailProps) {
  const [asking, setAsking] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { paciente, expediente, analisis } = detail;
  const isPending = paciente.estado === VALIDATION_STATES.pending;
  const isConfirmed = paciente.estado === VALIDATION_STATES.confirmed;

  const confirm = async (diseaseId: string) => {
    setSaving(true);
    setError(null);
    const message = await onConfirm(diseaseId);
    setSaving(false);
    setAsking(null);
    if (message) setError(message);
  };

  const groups = FINDING_GROUPS.map(({ type, label }) => ({
    label,
    items: expediente.hallazgos.filter((h) => h.tipoHallazgo === type),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="grid gap-8 lg:grid-cols-[18rem_1fr]">
      {/* Resumen: fijo al hacer scroll en pantallas grandes. */}
      <aside
        aria-label="Resumen del paciente"
        className="rounded-xl border-2 border-slate-300 bg-white p-5 text-slate-900 lg:sticky lg:top-6 lg:self-start"
      >
        <div className="flex items-center gap-3">
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${NAVY} text-white`}>
            <UserRound aria-hidden="true" className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <h2 className="text-xl leading-tight font-bold text-[#0b1533]">{paciente.nombreCompleto}</h2>
            <p className="font-mono text-sm text-slate-700">{paciente.idPaciente}</p>
          </div>
        </div>
        <p className="mt-3 text-slate-800">
          {paciente.edad} años · {SEX_LABEL[paciente.sexo] ?? paciente.sexo}
        </p>
        <div className="mt-2">
          <StatusText state={paciente.estado} />
        </div>

        <dl className="mt-5 space-y-4 border-t-2 border-slate-300 pt-5">
          <Field icon={Stethoscope} label="Enviado por">
            {paciente.solicitante ?? '—'}
          </Field>
          <Field icon={CalendarClock} label="Fecha de envío">
            {formatValidationDate(paciente.fechaSolicitud) ?? '—'}
          </Field>
          {isConfirmed && (
            <>
              <Field icon={CircleCheck} label="Diagnóstico confirmado">
                {paciente.diagnostico ?? '—'}
              </Field>
              <Field icon={UserRound} label="Confirmado por">
                {paciente.validador ?? '—'}
              </Field>
              <Field icon={CalendarCheck} label="Fecha de confirmación">
                {formatValidationDate(paciente.fechaValidacion) ?? '—'}
              </Field>
            </>
          )}
        </dl>
      </aside>

      <div className="min-w-0 space-y-10">
        <section aria-labelledby="findings-title">
          <SectionTitle id="findings-title" icon={ClipboardList} title="Hallazgos capturados" subtitle="Registrados por el médico tratante." />
          {groups.length === 0 ? (
            <p className="mt-4 text-slate-800">El médico tratante no ha capturado hallazgos.</p>
          ) : (
            <dl className="mt-4 divide-y-2 divide-slate-300 rounded-xl border-2 border-slate-300">
              {groups.map((group) => (
                <div key={group.label} className="grid gap-1 px-4 py-3 sm:grid-cols-[12rem_1fr] sm:gap-4">
                  <dt className="font-semibold text-[#0b1533]">{group.label}</dt>
                  <dd className="text-slate-800">
                    {group.items.map((item, index) => (
                      <span key={item.idRegistro}>
                        {item.descripcion}
                        {item.valor !== 'presente' && (
                          <span className="text-slate-700">
                            {' '}
                            ({item.valor}
                            {item.unidades ? ` ${item.unidades}` : ''})
                          </span>
                        )}
                        {index < group.items.length - 1 && <span className="text-slate-500"> · </span>}
                      </span>
                    ))}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </section>

        <section aria-labelledby="candidates-title">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <SectionTitle
              id="candidates-title"
              icon={Stethoscope}
              title="Diagnóstico diferencial"
              subtitle="Propuesto por la máquina de inferencia con los hallazgos actuales."
            />
          </div>

          {error && (
            <p role="alert" className="mt-4 flex items-start gap-2 rounded-lg border-2 border-red-500 px-4 py-2.5 text-red-800">
              <CircleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </p>
          )}

          {analisis.candidatos.length === 0 ? (
            <p className="mt-4 text-slate-800">Sin coincidencias con la base de conocimiento.</p>
          ) : (
            <ol className="mt-4 space-y-3">
              {analisis.candidatos.map((candidate, index) => {
                const percent = Math.round(candidate.puntaje * 100);
                const isChosen = isConfirmed && candidate.nombre === paciente.diagnostico;
                const canChoose = (isPending || isConfirmed) && !isChosen;
                const isAsking = asking === candidate.idEnfermedad;
                return (
                  <li
                    key={candidate.idEnfermedad}
                    className={`overflow-hidden rounded-xl border-2 bg-white ${isChosen ? 'border-teal-700' : 'border-slate-300'}`}
                  >
                    {/* El elegido lleva una franja de color con texto blanco. */}
                    {isChosen && (
                      <p className="flex items-center gap-2 bg-teal-700 px-4 py-1.5 text-sm font-semibold text-white">
                        <CircleCheck aria-hidden="true" className="h-4 w-4" />
                        Diagnóstico confirmado
                      </p>
                    )}
                    <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3 px-4 py-4">
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                          <span className="font-bold text-[#1e47c5] tabular-nums">{index + 1}.</span>
                          <span className="text-lg font-semibold text-slate-900">{candidate.nombre}</span>
                        </p>
                        <div className="mt-2 flex items-center gap-3">
                          <span
                            role="meter"
                            aria-label={`Coincidencia con ${candidate.nombre}`}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={percent}
                            className="h-2 w-44 overflow-hidden rounded-none bg-slate-200"
                          >
                            <span className="block h-full rounded-none bg-[#1e47c5]" style={{ width: `${percent}%` }} />
                          </span>
                          <span className="text-sm text-slate-700 tabular-nums">
                            <span className="font-semibold text-slate-900">{percent} %</span> · {candidate.coincidencias} de{' '}
                            {candidate.totalCriterios} criterios
                          </span>
                        </div>
                        {candidate.apoyos.length > 0 && (
                          <p className="mt-2 text-sm text-slate-700">
                            <span className="font-medium text-slate-800">Lo apoyan:</span> {candidate.apoyos.join(', ')}
                          </p>
                        )}
                        {candidate.tratamientoSugerido && (
                          <p className="mt-1 text-sm text-slate-700">
                            <span className="font-medium text-slate-800">Tratamiento sugerido:</span> {candidate.tratamientoSugerido}
                          </p>
                        )}
                      </div>

                      {canChoose && !isAsking && (
                        <button
                          type="button"
                          onClick={() => {
                            setError(null);
                            setAsking(candidate.idEnfermedad);
                          }}
                          disabled={saving}
                          className={isPending ? BUTTON_SUCCESS : BUTTON}
                        >
                          {isPending ? (
                            <CircleCheck aria-hidden="true" className="h-4 w-4" />
                          ) : (
                            <RefreshCcw aria-hidden="true" className="h-4 w-4" />
                          )}
                          {isPending ? 'Confirmar' : 'Cambiar a este diagnóstico'}
                        </button>
                      )}
                    </div>

                    {/* Segundo paso: evita confirmar por error de dedo. */}
                    {isAsking && (
                      <div
                        role="group"
                        aria-label={`Confirmar ${candidate.nombre}`}
                        className="mx-4 mb-4 flex flex-wrap items-center gap-3 bg-slate-100 px-4 py-3 text-slate-900"
                      >
                        <p className="flex-1 text-slate-900">
                          {isPending ? '¿Confirmar' : '¿Cambiar el diagnóstico a'} <strong>{candidate.nombre}</strong> para{' '}
                          {paciente.nombreCompleto}?
                        </p>
                        <button
                          type="button"
                          onClick={() => setAsking(null)}
                          disabled={saving}
                          className={BUTTON}
                        >
                          <X aria-hidden="true" className="h-4 w-4" />
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => confirm(candidate.idEnfermedad)}
                          disabled={saving}
                          aria-busy={saving}
                          className={BUTTON_SUCCESS}
                        >
                          <Check aria-hidden="true" className="h-4 w-4" />
                          {saving ? 'Guardando…' : isPending ? 'Sí, confirmar' : 'Sí, cambiar'}
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}
