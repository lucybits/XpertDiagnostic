'use client';

import type { CSSProperties } from 'react';
import { ChevronDown, ChevronUp, CircleCheck, Clock, Lock, type LucideIcon } from 'lucide-react';
import Collapsible from '@/components/ui/Collapsible';
import type { ClinicalSection, SectionStatus } from '@/components/home/clinicalSections';
import { FOCUS_RING } from './styles';

const HEADER_ID = 'section-header';

// Etiqueta de estado de la sección: fondo claro, texto del mismo tono e ícono.
const STATUS_STYLES: Record<SectionStatus, { label: string; icon: LucideIcon; className: string }> = {
  pending: {
    label: 'Bloqueada',
    icon: Lock,
    className: 'bg-slate-100 text-slate-600',
  },
  'in-progress': {
    // Igual que la barra lateral ("En proceso"); "Pendiente" se confundía con "bloqueada" (P-115).
    label: 'En proceso',
    icon: Clock,
    className: 'bg-orange-100 text-slate-900',
  },
  complete: {
    label: 'Completada',
    icon: CircleCheck,
    className: 'bg-emerald-100 text-emerald-700',
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
          <p className="flex items-center gap-2.5">
            <span className="truncate font-medium text-slate-600">{groupLabel}</span>
            <span className="shrink-0 rounded-md bg-[#116ee6] px-2 py-0.5 font-medium text-white tabular-nums">
              Paso {position} de {total}
            </span>
          </p>
          <h2 className="mt-1 truncate text-2xl leading-tight font-bold tracking-tight text-[#0b1533]">
            {section.label}
          </h2>
        </div>

        <span
          className={`relative isolate flex shrink-0 items-center gap-1.5 overflow-hidden rounded-full px-3 py-1 font-medium ${status.className}`}
        >
          {section.status === 'in-progress' && <PendingParticles />}
          <StatusIcon aria-hidden="true" className="h-4 w-4" />
          {status.label}
        </span>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={!isCollapsed}
          aria-controls={HEADER_ID}
          aria-label="Ocultar encabezado de la sección"
          className={`shrink-0 rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 ${FOCUS_RING}`}
        >
          <ChevronUp aria-hidden="true" className="h-5 w-5" />
        </button>
      </header>
    </Collapsible>
  );
}

// Figuras de "Pendiente": punto de partida (%), rumbo (px), tamaño (px), tono y ritmo (s).
const PARTICLES = [
  { left: 10, top: 60, dx: -10, dy: -12, size: 26, tone: 'bg-orange-300', duration: 3.2, delay: 0 },
  { left: 30, top: 30, dx: 8, dy: 10, size: 20, tone: 'bg-orange-400', duration: 3.8, delay: -1.2 },
  { left: 50, top: 70, dx: -6, dy: -14, size: 28, tone: 'bg-amber-300', duration: 3.5, delay: -2.4 },
  { left: 66, top: 25, dx: 10, dy: 10, size: 22, tone: 'bg-orange-300', duration: 3, delay: -0.7 },
  { left: 84, top: 55, dx: 8, dy: -10, size: 26, tone: 'bg-orange-400', duration: 4, delay: -1.9 },
  { left: 94, top: 35, dx: -10, dy: 12, size: 18, tone: 'bg-amber-300', duration: 3.4, delay: -2.9 },
] as const;

/**
 * Fondo animado de la etiqueta "Pendiente" (P-98): manchas naranjas muy difuminadas que nacen dentro
 * de la etiqueta, se dispersan y se desvanecen, en bucle continuo, detrás del texto.
 * Las figuras solo animan transform y opacity; el desenfoque se aplica una vez a su capa, que mide
 * lo mismo que la etiqueta (área pequeña). Con "reducir movimiento" no se muestran.
 */
function PendingParticles() {
  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 blur-md motion-reduce:hidden">
      {PARTICLES.map((particle, index) => (
        <span
          key={index}
          className={`absolute animate-status-particle rounded-full ${particle.tone}`}
          style={
            {
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              width: particle.size,
              height: particle.size,
              marginLeft: -particle.size / 2,
              marginTop: -particle.size / 2,
              animationDuration: `${particle.duration}s`,
              animationDelay: `${particle.delay}s`,
              '--dx': `${particle.dx}px`,
              '--dy': `${particle.dy}px`,
            } as CSSProperties
          }
        />
      ))}
    </span>
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
