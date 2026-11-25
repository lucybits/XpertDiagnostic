'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, CircleAlert, CircleCheck, CircleDashed, Download, Printer, Search, UserRound } from 'lucide-react';
import LoadingDots from '@/components/ui/LoadingDots';
import { getResult } from '@/services/resultService';
import type { PatientResult } from '@/types/result';
import { VALIDATION_STATES } from '@/types/validation';
import { CarePlanCard, ClinicalHistoryCard, DiagnosisCard, TreatmentCard } from './ResultSections';

const NAV_ITEM =
  'flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-base font-medium text-slate-100 transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60';

/**
 * Interfaz de salida del expediente (P-105, boceto de Lucía). Muestra lo que el médico capturó
 * (historia clínica) y las salidas: diagnóstico confirmado por el internista, tratamiento indicado y plan.
 * Es de solo lectura (P-164): las salidas las calcula la máquina de inferencia y nadie las edita aquí.
 *
 * - Izquierda: acciones (buscar paciente, volver a la captura, descargar PDF, imprimir).
 * - Centro: encabezado del paciente y las cuatro tarjetas.
 * - Derecha: "Expediente de", con lo que falta por completar.
 * Al imprimir o guardar como PDF solo queda el centro.
 */
export default function PatientResultScreen({ patientId }: { patientId: string }) {
  const [result, setResult] = useState<PatientResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void getResult(patientId).then((response) => {
      if (!active) return;
      if (response.ok) setResult(response.data);
      else setError(response.message);
    });
    return () => {
      active = false;
    };
  }, [patientId]);

  // El navegador usa el título de la página como nombre del PDF al "Guardar como PDF".
  const printWithTitle = () => {
    const previous = document.title;
    if (result) document.title = `Expediente ${result.paciente.idPaciente} - ${result.paciente.nombreCompleto}`;
    window.addEventListener('afterprint', () => (document.title = previous), { once: true });
    window.print();
  };

  return (
    <div className="flex min-h-dvh bg-white text-base text-slate-900 print:block print:min-h-0">
      {/* Acciones */}
      <aside className="sticky top-0 flex h-dvh w-72 shrink-0 flex-col gap-1 border-r-2 border-white/10 bg-[#0b1533] px-3 py-4 print:hidden max-lg:hidden">
        <div className="mb-4 flex items-center gap-2 px-1">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white">
            <Image src="/logoxd.png" alt="" width={22} height={22} className="h-5.5 w-5.5 object-contain" />
          </span>
          <span className="text-lg font-semibold tracking-tight text-white">XpertDiagnostic</span>
        </div>
        <Link
          href="/home?buscar=1"
          className="mb-2 flex items-center justify-center gap-2 rounded-lg bg-white px-3 py-2.5 font-medium text-slate-900 transition-colors hover:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          <Search aria-hidden="true" className="h-4 w-4" />
          Buscar paciente
        </Link>
        <Link href={`/home?paciente=${patientId}`} className={NAV_ITEM}>
          <ArrowLeft aria-hidden="true" className="h-5 w-5" />
          Volver a la captura
        </Link>
        <button type="button" onClick={printWithTitle} disabled={!result} className={NAV_ITEM}>
          <Download aria-hidden="true" className="h-5 w-5" />
          Descargar PDF
        </button>
        <button type="button" onClick={() => window.print()} disabled={!result} className={NAV_ITEM}>
          <Printer aria-hidden="true" className="h-5 w-5" />
          Imprimir
        </button>
        <p className="mt-auto px-3 text-sm text-slate-400">
          Para el PDF, elige «Guardar como PDF» en la ventana de impresión.
        </p>
      </aside>

      {/* Contenido */}
      <main className="min-w-0 flex-1">
        {error ? (
          <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
            <CircleAlert aria-hidden="true" className="h-10 w-10 text-red-600" />
            <p className="text-lg font-medium">{error}</p>
            <Link href="/home" className="font-medium text-[#1e47c5] underline underline-offset-2">
              Volver al inicio
            </Link>
          </div>
        ) : !result ? (
          <div role="status" className="flex min-h-dvh items-center justify-center gap-3 text-slate-800">
            <LoadingDots label={null} />
            Cargando el resultado del expediente…
          </div>
        ) : (
          <>
            {/* Encabezado del paciente */}
            <header className="flex items-center gap-4 border-b-2 border-slate-200 bg-white px-6 py-4 print:border-slate-300 sm:px-10">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-400 text-black print:hidden">
                <UserRound aria-hidden="true" className="h-6 w-6" />
              </span>
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-2xl font-bold text-[#0b1533]">{result.paciente.nombreCompleto}</h1>
                <p className="text-slate-800">
                  {result.paciente.edad} años | Exp. {result.paciente.idPaciente}
                </p>
              </div>
              <span className="hidden text-sm text-slate-700 print:block">XpertDiagnostic | Resultado del expediente</span>
              {/* Acciones en pantallas medianas y móvil (la columna izquierda se oculta). */}
              <div className="flex gap-2 print:hidden lg:hidden">
                <Link href={`/home?paciente=${patientId}`} aria-label="Volver a la captura" className="rounded-lg p-2 text-slate-800 hover:bg-slate-100">
                  <ArrowLeft aria-hidden="true" className="h-5 w-5" />
                </Link>
                <button type="button" onClick={printWithTitle} aria-label="Descargar PDF" className="rounded-lg p-2 text-slate-800 hover:bg-slate-100">
                  <Download aria-hidden="true" className="h-5 w-5" />
                </button>
              </div>
            </header>

            <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6 sm:px-8 print:max-w-none print:space-y-4 print:px-0 print:py-4">
              <ClinicalHistoryCard result={result} />
              <DiagnosisCard result={result} />
              <TreatmentCard result={result} />
              <CarePlanCard result={result} />
            </div>
          </>
        )}
      </main>

      {/* Expediente de */}
      {result && (
        <aside
          aria-label={`Expediente de ${result.paciente.nombreCompleto}`}
          className="sticky top-0 h-dvh w-80 shrink-0 space-y-4 overflow-y-auto border-l-2 border-slate-200 bg-white px-5 py-5 print:hidden max-xl:hidden"
        >
          <h2 className="text-lg font-semibold">
            Expediente de <span className="block truncate text-[#0b1533]">{result.paciente.nombreCompleto}</span>
          </h2>
          <ul className="space-y-2.5">
            <Status done={result.expediente.hallazgos.length > 0} label="Historia clínica" detail={`${result.expediente.hallazgos.length} hallazgos`} />
            <Status
              done={result.enfermedadDiagnosticada !== null}
              label="Diagnóstico"
              detail={
                result.enfermedadDiagnosticada ??
                (result.paciente.estadoValidacion === VALIDATION_STATES.pending ? 'En validación' : 'Sin enviar a validación')
              }
            />
            <Status done={result.idTratamiento !== null} label="Tratamiento" detail={result.idTratamiento ? 'Indicado' : 'Pendiente'} />
            <Status done={result.plan !== null} label="Plan y seguimiento" detail={result.plan ? 'Indicado' : 'Pendiente'} />
          </ul>
          <p className="text-sm text-slate-700">
            Las salidas las calcula la máquina de inferencia para el diagnóstico que confirma el médico internista.
          </p>
        </aside>
      )}
    </div>
  );
}

function Status({ done, label, detail }: { done: boolean; label: string; detail: string }) {
  const Icon = done ? CircleCheck : CircleDashed;
  return (
    <li className="flex items-start gap-2.5">
      <Icon aria-hidden="true" className={`mt-0.5 h-5 w-5 shrink-0 ${done ? 'text-teal-700' : 'text-slate-600'}`} />
      <span className="min-w-0">
        <span className="block font-medium text-slate-900">
          {label}
          <span className="sr-only">: {done ? 'completo' : 'pendiente'}</span>
        </span>
        <span className="block truncate text-slate-700">{detail}</span>
      </span>
    </li>
  );
}
