'use client';

import { useSyncExternalStore } from 'react';
import { Menu, PanelRight, PanelTopClose, PanelTopOpen } from 'lucide-react';
import HelpMenu from './HelpMenu';
import { formatLongDate, getGreeting } from '@/lib/greeting';
import ProfileMenu from './ProfileMenu';
import type { DoctorProfile } from './currentDoctor';

type TopNavbarProps = {
  doctor: DoctorProfile;
  isSidebarOpen: boolean;
  onOpenSidebar: () => void;
  isRecordOpen: boolean;
  onOpenRecord: () => void;
  /** Barra replegada hacia arriba (solo en pantallas grandes, donde la barra lateral está fija). */
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
};

const ICON_BUTTON =
  'rounded-lg p-2.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60';

// La hora se lee solo en el navegador (en el servidor no se conoce la zona horaria del médico)
// y se vuelve a leer cada minuto para que el saludo cambie solo.
function subscribeToClock(onChange: () => void) {
  const interval = setInterval(onChange, 60_000);
  return () => clearInterval(interval);
}
const getClientGreeting = () => getGreeting(new Date());
const getClientDate = () => formatLongDate(new Date());
const getServerValue = () => null;

/**
 * Barra superior de la pantalla principal: saludo al médico, fecha, accesos rápidos
 * (notificaciones y ayuda) y menú de cuenta. Ocupa solo el área de contenido, a la derecha
 * de la barra lateral, así que no se superponen.
 *
 * Plegado (P-75): en pantallas grandes la barra sube como una persiana y deja una franja delgada
 * con una lengüeta colgando al centro; al pulsar la lengüeta, la barra vuelve a bajar.
 * Se anima la altura entre dos valores fijos y el desplazamiento con transform. En móvil no se pliega,
 * porque ahí la barra tiene el botón del menú.
 */
export default function TopNavbar({
  doctor,
  isSidebarOpen,
  onOpenSidebar,
  isRecordOpen,
  onOpenRecord,
  isCollapsed,
  onToggleCollapsed,
}: TopNavbarProps) {
  const greeting = useSyncExternalStore(subscribeToClock, getClientGreeting, getServerValue);
  const longDate = useSyncExternalStore(subscribeToClock, getClientDate, getServerValue);

  return (
    <div className="relative z-20 shrink-0">
      <div
        className={`relative h-18 bg-blue-900 transition-[height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none sm:h-20 ${
          isCollapsed ? 'lg:h-1.5' : ''
        }`}
      >
        {/* Corte diagonal decorativo (P-92): desde la mitad, el lado derecho es un azul un poco más
            claro, con el borde inclinado como "\". Es estático (clip-path), sin animación ni desenfoque. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-blue-800 [clip-path:polygon(46%_0,100%_0,100%_100%,54%_100%)]"
        />
        <header
          id="home-topbar"
          className={`relative flex h-18 items-center gap-4 px-4 transition-[translate,opacity,visibility] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none sm:h-20 sm:px-8 ${
            isCollapsed ? 'lg:invisible lg:-translate-y-full lg:opacity-0' : ''
          }`}
        >
          <button
            type="button"
            onClick={onOpenSidebar}
            aria-label="Abrir menú"
            aria-expanded={isSidebarOpen}
            aria-controls="home-sidebar"
            className={`-ml-1 lg:hidden ${ICON_BUTTON}`}
          >
            <Menu aria-hidden="true" className="h-6 w-6" />
          </button>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl leading-tight font-semibold text-white">
              {greeting ?? 'Hola'}, {doctor.displayName}
            </h1>
            <p className="mt-1 hidden truncate text-base leading-tight text-white/70 sm:block">
              {longDate ?? ' '}
            </p>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* En xl el expediente ya está visible a la derecha; antes, se abre como cajón. */}
            <button
              type="button"
              onClick={onOpenRecord}
              aria-label="Ver expediente"
              aria-expanded={isRecordOpen}
              aria-controls="patient-record-drawer"
              className={`xl:hidden ${ICON_BUTTON}`}
            >
              <PanelRight aria-hidden="true" className="h-5 w-5" />
            </button>
            {/* Notificaciones se quitó: no había notificaciones (P-115). Ayuda explica el flujo. */}
            <HelpMenu buttonClassName={`max-sm:hidden ${ICON_BUTTON}`} />
            <span aria-hidden="true" className="mx-2 h-10 w-0.5 bg-white/20 max-sm:hidden" />
            <ProfileMenu doctor={doctor} />
            {/* Separado del menú de cuenta y con otro ícono, para no confundirlo con su flecha (P-76). */}
            <span aria-hidden="true" className="mx-1 h-10 w-0.5 bg-white/20 max-lg:hidden" />
            <button
              type="button"
              onClick={onToggleCollapsed}
              aria-label="Ocultar barra superior"
              title="Ocultar barra superior"
              aria-expanded={!isCollapsed}
              aria-controls="home-topbar"
              className={`-mr-2 max-lg:hidden ${ICON_BUTTON}`}
            >
              <PanelTopClose aria-hidden="true" className="h-5 w-5" />
            </button>
          </div>
        </header>
      </div>

      {/* Lengüeta que cuelga de la franja: vuelve a bajar la barra. */}
      {isCollapsed && (
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-expanded={false}
          aria-controls="home-topbar"
          className="absolute top-1.5 left-1/2 flex max-w-64 -translate-x-1/2 items-center gap-1.5 rounded-b-xl bg-blue-900 py-1 pr-3.5 pl-3 text-sm font-medium text-white transition-[translate,opacity] delay-200 duration-300 ease-out hover:bg-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#116ee6]/60 max-lg:hidden motion-reduce:transition-none starting:-translate-y-full starting:opacity-0"
        >
          <PanelTopOpen aria-hidden="true" className="h-4 w-4 shrink-0" />
          <span className="truncate">{doctor.displayName}</span>
          <span className="sr-only">: mostrar barra superior</span>
        </button>
      )}
    </div>
  );
}
