'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  ChevronDown,
  CircleCheck,
  Lock,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  UserPlus,
  UserRound,
  X,
} from 'lucide-react';
import Collapsible from '@/components/ui/Collapsible';
import Tooltip from '@/components/ui/Tooltip';
import { isSectionLocked, type ClinicalSection, type ClinicalSectionGroup, type SectionStatus } from './clinicalSections';

type SidebarProps = {
  groups: readonly ClinicalSectionGroup[];
  activeSectionId: string;
  onSelectSection: (id: string) => void;
  /** Solo en pantallas pequeñas: si el menú está abierto. En escritorio siempre es visible. */
  isOpen: boolean;
  onClose: () => void;
  /** Abre el buscador de pacientes. */
  onSearchPatient: () => void;
  /** Abre el alta de paciente (ESP-004). */
  onNewPatient: () => void;
  /** Nombre del paciente seleccionado, o null si no hay ninguno. */
  selectedPatientName: string | null;
};

const STATUS_LABELS: Record<SectionStatus, string | null> = {
  complete: 'completada',
  'in-progress': 'en proceso',
  pending: 'bloqueada',
};

const LOCKED_HINT = 'Se habilita al completar la sección anterior';

// Etiqueta verde cyan de las secciones desbloqueadas.
const UNLOCKED_HINTS: Record<SectionStatus, string> = {
  'in-progress': 'En proceso',
  complete: 'Completada',
  pending: '',
};

// Anillo de foco claro: se distingue sobre el fondo azul marino.
const FOCUS_RING = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60';

// Con la barra contraída (solo en escritorio), cada botón es un cuadrado de 40 px centrado.
const COLLAPSED_SQUARE = 'lg:mx-auto lg:h-10 lg:w-10 lg:justify-center lg:gap-0 lg:p-0';
// Todos los íconos de la barra contraída miden lo mismo: 20 px.
const COLLAPSED_ICON = 'lg:h-5 lg:w-5';
// Barra de desplazamiento delgada y oscura, visible solo al pasar el cursor o al navegar con teclado.
// Con la barra contraída se oculta (lg:[scrollbar-width:none]) para no descentrar los íconos.
const SIDEBAR_SCROLLBAR =
  '[scrollbar-width:thin] [scrollbar-color:transparent_transparent] hover:[scrollbar-color:rgb(255_255_255/0.2)_transparent] focus-within:[scrollbar-color:rgb(255_255_255/0.2)_transparent]';

/**
 * Barra lateral de la pantalla principal: búsqueda de paciente, secciones del expediente
 * clínico agrupadas y botón para guardar. En escritorio se puede contraer a solo íconos;
 * en pantallas pequeñas se abre como panel. Por ahora solo es visual.
 */
export default function Sidebar({
  groups,
  activeSectionId,
  onSelectSection,
  isOpen,
  onClose,
  onSearchPatient,
  onNewPatient,
  selectedPatientName,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [closedGroups, setClosedGroups] = useState<ReadonlySet<string>>(new Set());

  const toggleGroup = (id: string) =>
    setClosedGroups((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // Al contraer, las etiquetas solo se ocultan en escritorio; en el panel móvil siempre se ven.
  const hideWhenCollapsed = isCollapsed ? 'lg:sr-only' : '';

  return (
    <aside
      id="home-sidebar"
      aria-label="Menú del expediente"
      className={`fixed inset-y-0 left-0 z-40 flex w-72 shrink-0 flex-col border-r-2 border-white/10 bg-[#0b1533] text-slate-100 transition-[width,transform] duration-300 ease-out motion-reduce:transition-none lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0 ${
        isCollapsed ? 'lg:w-[4.5rem]' : ''
      } ${isOpen ? 'translate-x-0' : 'max-lg:invisible max-lg:-translate-x-full'}`}
    >
      {/* Encabezado */}
      <div className={`flex items-center gap-2 px-4 pt-4 pb-3 ${isCollapsed ? 'lg:flex-col lg:gap-3 lg:px-0 lg:pb-4' : ''}`}>
        {/* Logo decorativo: el nombre del sistema está escrito al lado. */}
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white">
          <Image src="/logoxd.png" alt="" width={22} height={22} className="h-5.5 w-5.5 object-contain" />
        </span>
        <span className={`text-lg font-semibold tracking-tight text-white ${hideWhenCollapsed}`}>
          XpertDiagnostic
        </span>

        <Tooltip
          label={isCollapsed ? 'Expandir menú' : 'Contraer menú'}
          enabled={isCollapsed}
          className={isCollapsed ? '' : 'ml-auto max-lg:hidden'}
        >
          <button
            type="button"
            onClick={() => setIsCollapsed((collapsed) => !collapsed)}
            aria-label={isCollapsed ? 'Expandir menú' : 'Contraer menú'}
            aria-expanded={!isCollapsed}
            aria-controls="home-sidebar"
            className={`flex items-center rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white max-lg:hidden ${
              isCollapsed ? COLLAPSED_SQUARE : ''
            } ${FOCUS_RING}`}
          >
            {isCollapsed ? (
              <PanelLeftOpen aria-hidden="true" className="h-5 w-5" />
            ) : (
              <PanelLeftClose aria-hidden="true" className="h-5 w-5" />
            )}
          </button>
        </Tooltip>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar menú"
          className={`ml-auto rounded-md p-1.5 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden ${FOCUS_RING}`}
        >
          <X aria-hidden="true" className="h-5 w-5" />
        </button>
      </div>

      {/* Paciente */}
      <div className={`space-y-2 px-3 ${isCollapsed ? 'lg:px-0' : ''}`}>
        <Tooltip label="Buscar paciente" enabled={isCollapsed}>
          <button
            type="button"
            onClick={onSearchPatient}
            aria-haspopup="dialog"
            className={`flex w-full items-center justify-center gap-2 rounded-lg bg-white px-3 py-2.5 text-base font-medium text-slate-900 transition-colors duration-200 hover:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1533] ${
              isCollapsed ? COLLAPSED_SQUARE : ''
            }`}
          >
            <Search aria-hidden="true" className={`h-4 w-4 shrink-0 ${isCollapsed ? COLLAPSED_ICON : ''}`} />
            <span className={hideWhenCollapsed}>Buscar paciente</span>
          </button>
        </Tooltip>

        {/* Acción secundaria (ESP-004): con borde y sin relleno, para que "Buscar" siga siendo la principal. */}
        <Tooltip label="Nuevo paciente" enabled={isCollapsed}>
          <button
            type="button"
            onClick={onNewPatient}
            aria-haspopup="dialog"
            className={`flex w-full items-center justify-center gap-2 rounded-lg border-2 border-white/25 px-3 py-2 text-base font-medium text-white transition-colors duration-200 hover:border-white/50 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1533] ${
              isCollapsed ? COLLAPSED_SQUARE : ''
            }`}
          >
            <UserPlus aria-hidden="true" className={`h-4 w-4 shrink-0 ${isCollapsed ? COLLAPSED_ICON : ''}`} />
            <span className={hideWhenCollapsed}>Nuevo paciente</span>
          </button>
        </Tooltip>

        <div
          className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-base text-slate-400 ${
            isCollapsed ? 'lg:hidden' : ''
          }`}
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-slate-300">
            <UserRound aria-hidden="true" className="h-4 w-4" />
          </span>
          <span className={`min-w-0 truncate ${selectedPatientName ? 'font-medium text-white' : ''}`}>
            {selectedPatientName ?? 'Sin paciente seleccionado'}
          </span>
        </div>
      </div>

      {/* Secciones del expediente */}
      <nav
        aria-label="Expediente clínico"
        className={`mt-3 flex-1 overflow-x-hidden overflow-y-auto px-3 pb-4 ${SIDEBAR_SCROLLBAR} ${
          isCollapsed ? 'lg:px-0 lg:[scrollbar-width:none]' : ''
        }`}
      >
        {groups.map((group) => {
          const isGroupOpen = isCollapsed || !closedGroups.has(group.id);
          const listId = `sidebar-group-${group.id}`;

          return (
            <div key={group.id} className="mt-3 first:mt-0">
              {isCollapsed && <hr className="mx-auto mb-3 w-8 border-t-2 border-white/10 max-lg:hidden" />}
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                aria-expanded={isGroupOpen}
                aria-controls={listId}
                className={`flex w-full items-center gap-1 rounded-md px-2 py-1.5 text-base font-medium text-slate-400 transition-colors hover:text-slate-100 ${
                  isCollapsed ? 'lg:hidden' : ''
                } ${FOCUS_RING}`}
              >
                <ChevronDown
                  aria-hidden="true"
                  className={`h-3.5 w-3.5 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none ${
                    isGroupOpen ? '' : '-rotate-90'
                  }`}
                />
                {group.label}
              </button>

              {/* Animación: la altura la anima Collapsible y las secciones entran en cascada
                  (solo transform y opacity, que el navegador procesa sin recalcular el diseño).
                  El margen de 2 px evita que el recorte tape el contorno de la sección activa. */}
              <Collapsible id={listId} open={isGroupOpen} className="-mx-0.5 px-0.5">
                <ul className={`space-y-0.5 py-0.5 ${isCollapsed ? 'lg:space-y-1.5' : ''}`}>
                  {group.sections.map((section, index) => (
                    <li
                      key={section.id}
                      style={{ transitionDelay: isGroupOpen ? `${60 + index * 35}ms` : '0ms' }}
                      className={`transition-[opacity,transform] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                        isGroupOpen
                          ? 'translate-x-0 opacity-100 duration-300'
                          : '-translate-x-3 opacity-0 duration-150'
                      }`}
                    >
                      <SectionItem
                        section={section}
                        isActive={section.id === activeSectionId}
                        isCollapsed={isCollapsed}
                        onSelect={onSelectSection}
                      />
                    </li>
                  ))}
                </ul>
              </Collapsible>
            </div>
          );
        })}
      </nav>

    </aside>
  );
}

type SectionItemProps = {
  section: ClinicalSection;
  isActive: boolean;
  isCollapsed: boolean;
  onSelect: (id: string) => void;
};

function SectionItem({ section, isActive, isCollapsed, onSelect }: SectionItemProps) {
  const { id, label, icon: Icon, status } = section;
  const statusLabel = STATUS_LABELS[status];
  const isLocked = isSectionLocked(section);

  // Bloqueada: sigue siendo enfocable (aria-disabled) para que el lector de pantalla la anuncie,
  // pero no se puede abrir; el tooltip negro explica por qué. Desbloqueada: tooltip verde cyan
  // con su estado.
  return (
    <Tooltip
      label={
        isLocked
          ? isCollapsed
            ? `${label}: bloqueada`
            : LOCKED_HINT
          : isCollapsed
            ? `${label}: ${UNLOCKED_HINTS[status]}`
            : UNLOCKED_HINTS[status]
      }
      enabled
      tone={isLocked ? 'dark' : 'accent'}
    >
      <button
        type="button"
        onClick={() => {
          if (!isLocked) onSelect(id);
        }}
        aria-disabled={isLocked || undefined}
        aria-current={isActive ? 'true' : undefined}
        className={`group relative flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-base transition-colors duration-150 ${
          isLocked
            ? 'cursor-default text-slate-500'
            : isActive
              ? 'bg-white/12 font-medium text-white'
              : 'text-slate-300 hover:bg-white/6 hover:text-white'
        } ${isCollapsed ? COLLAPSED_SQUARE : ''} ${FOCUS_RING}`}
      >
        <Icon
          aria-hidden="true"
          className={`h-4.5 w-4.5 shrink-0 ${isCollapsed ? COLLAPSED_ICON : ''} ${
            isLocked ? 'text-slate-600' : isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
          }`}
        />

        <span className={`flex-1 leading-snug ${isCollapsed ? 'lg:sr-only' : ''}`}>
          {label}
          {statusLabel && <span className="sr-only">, {statusLabel}</span>}
        </span>

        {status === 'complete' && (
          <CircleCheck
            aria-hidden="true"
            className={`h-4 w-4 shrink-0 text-emerald-400 ${
              isCollapsed ? 'lg:hidden' : ''
            }`}
          />
        )}
        {isLocked && (
          <Lock
            aria-hidden="true"
            className={`h-4 w-4 shrink-0 text-slate-500 ${isCollapsed ? 'lg:hidden' : ''}`}
          />
        )}
      </button>
    </Tooltip>
  );
}
