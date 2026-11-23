'use client';

import { ChevronDown, ChevronUp, CircleCheck, Clock, Lock, type LucideIcon } from 'lucide-react';
import Collapsible from '@/components/ui/Collapsible';
import type { ClinicalSection, SectionStatus } from '@/components/home/clinicalSections';
import { FOCUS_RING } from './styles';

const HEADER_ID = 'section-header';

// Etiqueta de estado de la sección: fondo claro, texto del mismo tono e ícono. Estática: el estado se
// lee por el texto y el color, sin animación decorativa.
const STATUS_STYLES: Record<SectionStatus, { label: string; icon: LucideIcon; className: string }> = {
  pending: {
    label: 'Bloqueada',
    icon: Lock,
    className: 'bg-slate-100 text-slate-800',
  },
  'in-progress': {
    // Igual que la barra lateral ("En proceso"); "Pendiente" se confundía con "bloqueada" (P-115).
    label: 'En proceso',
    icon: Clock,
    className: 'bg-amber-100 text-amber-900',
  },
  complete: {
    label: 'Completada',
    icon: CircleCheck,
    className: 'bg-emerald-100 text-slate-900',
  },
};

type SectionHeaderProps = {
  groupLabel: string;
  section: ClinicalSection;
  /** Posición de la sección (1..total) para el indicador de avance. */
  position: number;
  total: number;
  isCollapsed: boolean;
  onToggle: () => void;
};

/**
 * Encabezado de la sección clínica sobre el chat. Se puede ocultar por completo para dar más
 * espacio a la conversación; entonces queda ShowSectionHeaderButton para volver a mostrarlo.
 */
export default function SectionHeader({
  groupLabel,
  section,
  position,
  total,
  isCollapsed,
  onToggle,
}: SectionHeaderProps) {
  const status = STATUS_STYLES[section.status];
  const StatusIcon = status.icon;
  const SectionIcon = section.icon;

  return (
    <Collapsible id={HEADER_ID} open={!isCollapsed} className="shrink-0">
      <header className="flex items-center gap-4 border-b-2 border-slate-200 px-4 py-4 sm:px-8">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0b1533] text-white">
          <SectionIcon aria-hidden="true" className="h-6 w-6" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-slate-800">
            <span className="truncate font-medium">{groupLabel}</span>
            <span aria-hidden="true" className="text-slate-300">
              /
            </span>
            <span className="shrink-0 tabular-nums">
              Paso {position} de {total}
            </span>
          </p>
          <h2 className="mt-1 truncate text-2xl leading-tight font-bold tracking-tight text-[#0b1533]">
            {section.label}
          </h2>
        </div>

        <span className={`flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1 font-medium ${status.className}`}>
          <StatusIcon aria-hidden="true" className="h-4 w-4" />
          {status.label}
        </span>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={!isCollapsed}
          aria-controls={HEADER_ID}
          aria-label="Ocultar encabezado de la sección"
          className={`shrink-0 rounded-lg p-2 text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-800 ${FOCUS_RING}`}
        >
          <ChevronUp aria-hidden="true" className="h-5 w-5" />
        </button>
      </header>
    </Collapsible>
  );
}

/** Con el encabezado oculto queda solo este botón (esquina superior derecha) para volver a mostrarlo. */
export function ShowSectionHeaderButton({ sectionLabel, onShow }: { sectionLabel: string; onShow: () => void }) {
  return (
    <button
      type="button"
      onClick={onShow}
      aria-expanded={false}
      aria-controls={HEADER_ID}
      className={`absolute top-3 right-4 z-10 flex items-center gap-1.5 rounded-full border-2 border-slate-200 bg-white py-1 pr-3 pl-2 font-semibold text-slate-900 transition-colors duration-200 hover:border-slate-300 starting:opacity-0 sm:right-8 ${FOCUS_RING}`}
    >
      <ChevronDown aria-hidden="true" className="h-4 w-4" />
      <span>
        {sectionLabel}
        <span className="sr-only">: mostrar encabezado de la sección</span>
      </span>
    </button>
  );
}
