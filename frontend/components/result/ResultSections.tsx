'use client';

import { useId, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Hourglass, Pill } from 'lucide-react';
import { FINDING_GROUPS } from '@/types/record';
import type { PatientResult, TreatmentView } from '@/types/result';
import { formatValidationDate, VALIDATION_STATES } from '@/types/validation';

const FOCUS_RING = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#116ee6]/60';

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

/** 1. Historia clínica: las entradas capturadas (hallazgos). */
export function ClinicalHistoryCard({ result }: { result: PatientResult }) {
  const ids = useId();
  const { expediente } = result;
  return (
    <ResultCard title="Historia clínica" id={`${ids}-history`}>
      <dl className="space-y-3">
        {FINDING_GROUPS.map(({ type, label }) => {
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

/** Diagnóstico, tratamiento y plan solo se muestran si el internista ya confirmó (P-164). */
const isConfirmed = (result: PatientResult) =>
  result.paciente.estadoValidacion === VALIDATION_STATES.confirmed && result.enfermedadDiagnosticada !== null;

/** Aviso de las tarjetas de salida mientras no hay confirmación del médico internista. */
function AwaitingConfirmation({ result }: { result: PatientResult }) {
  return (
    <p className="flex items-start gap-2 text-slate-800">
      <Hourglass aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-slate-700" />
      {result.paciente.estadoValidacion === VALIDATION_STATES.pending
        ? 'Disponible cuando el médico internista confirme el diagnóstico.'
        : 'Disponible cuando el diagnóstico se envíe a validación y el médico internista lo confirme.'}
    </p>
  );
}

/**
 * 2. Diagnóstico: el que confirmó el médico internista entre los diagnósticos diferenciales de la máquina
 * de inferencia (P-151). Solo lectura (P-164).
 */
export function DiagnosisCard({ result }: { result: PatientResult }) {
  const ids = useId();
  const { estadoValidacion, validadoPor } = result.paciente;
  const confirmedAt = formatValidationDate(result.fechaValidacion);
  return (
    <ResultCard title="Diagnóstico" id={`${ids}-diagnosis`}>
      {isConfirmed(result) ? (
        <>
          <p className="text-2xl font-bold text-[#0b1533]">{result.enfermedadDiagnosticada}</p>
          <p className="mt-1 text-slate-800">
            Calculado por la máquina de inferencia y confirmado por el médico internista
            {validadoPor ? ` ${validadoPor}` : ''}
            {confirmedAt ? ` el ${confirmedAt}` : ''}.
          </p>
        </>
      ) : (
        <p className="flex items-start gap-2 text-slate-800">
          <Hourglass aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-slate-700" />
          {estadoValidacion === VALIDATION_STATES.pending
            ? 'En validación del médico internista. El diagnóstico aparecerá cuando lo confirme.'
            : 'Aún no se ha enviado a validación del médico internista.'}
        </p>
      )}
      <Link
        href={`/home?paciente=${result.paciente.idPaciente}`}
        className={`mt-3 inline-block font-medium text-[#1e47c5] underline underline-offset-2 hover:text-[#0b1533] print:hidden ${FOCUS_RING}`}
      >
        {estadoValidacion === null ? 'Ir al diagnóstico diferencial' : 'Ver el diagnóstico diferencial'}
      </Link>
    </ResultCard>
  );
}

const formatDose = (min: number | null, max: number | null, units: string | null) => {
  if (min === null && max === null) return null;
  const range = min !== null && max !== null && min !== max ? `${min}–${max}` : String(min ?? max);
  return units ? `${range} ${units}` : range;
};

const doseOf = (treatment: TreatmentView) => formatDose(treatment.dosisMinima, treatment.dosisMaxima, treatment.unidades);

/**
 * 3. Tratamiento: el primero de la enfermedad confirmada, como lo da inference_engine.prg, y debajo los
 * demás de la base de conocimiento. Solo lectura (P-164).
 */
export function TreatmentCard({ result }: { result: PatientResult }) {
  const ids = useId();
  const indicated = result.tratamientos.find((t) => t.idTratamiento === result.idTratamiento) ?? null;
  const others = result.tratamientos.filter((t) => t !== indicated);
  const indicatedDose = indicated ? doseOf(indicated) : null;
  return (
    <ResultCard title="Tratamiento" id={`${ids}-treatment`}>
      {!isConfirmed(result) ? (
        <AwaitingConfirmation result={result} />
      ) : indicated === null ? (
        <p className="text-slate-800">La base de conocimiento no tiene tratamientos para {result.enfermedadDiagnosticada}.</p>
      ) : (
        <>
          <div className="flex items-start gap-3 bg-slate-100 px-4 py-3">
            <Pill aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-[#0b1533]" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-700">Tratamiento indicado</p>
              <p className="font-semibold text-slate-900">{indicated.descripcion}</p>
              {indicatedDose && <p className="text-slate-800">Dosis: {indicatedDose}</p>}
            </div>
          </div>
          {others.length > 0 && (
            <div className="mt-4">
              <h3 className="font-medium text-slate-700 break-after-avoid">
                Otros tratamientos para {result.enfermedadDiagnosticada}
              </h3>
              <ul className="mt-1.5 divide-y-2 divide-slate-100 border-y-2 border-slate-100">
                {others.map((treatment) => {
                  const dose = doseOf(treatment);
                  return (
                    <li
                      key={treatment.idTratamiento}
                      className="flex flex-wrap items-baseline justify-between gap-x-4 py-2 break-inside-avoid"
                    >
                      <span className="text-slate-900">{treatment.descripcion}</span>
                      {dose && <span className="text-sm text-slate-700">Dosis: {dose}</span>}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </>
      )}
    </ResultCard>
  );
}

/**
 * 4. Plan, expectativa (pronóstico) y seguimiento. El plan indicado lista los tratamientos de la base de
 * conocimiento; pronóstico y seguimiento son los guardados del paciente, si tiene. Solo lectura (P-164).
 */
export function CarePlanCard({ result }: { result: PatientResult }) {
  const ids = useId();
  const { plan } = result;
  const fields = [
    { label: 'Plan indicado', value: plan?.planIndicado ?? null },
    { label: 'Expectativa (pronóstico)', value: plan?.pronostico ?? null },
    { label: 'Seguimiento', value: plan?.seguimiento ?? null },
  ];
  return (
    <ResultCard title="Plan, expectativa y seguimiento" id={`${ids}-plan`}>
      {!isConfirmed(result) ? (
        <AwaitingConfirmation result={result} />
      ) : plan === null ? (
        <p className="text-slate-800">Sin plan registrado para {result.enfermedadDiagnosticada}.</p>
      ) : (
        <dl className="space-y-3">
          {fields.map((field) => (
            <div key={field.label} className="break-inside-avoid">
              <dt className="font-medium text-slate-700">{field.label}</dt>
              <dd className={`mt-0.5 whitespace-pre-line ${field.value ? 'text-slate-900' : 'text-slate-700'}`}>
                {field.value ?? 'Sin registro'}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </ResultCard>
  );
}
