'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, LogOut, UserRound } from 'lucide-react';
import { logoutAndGoToLogin } from '@/services/doctorService';
import { getInitials, type DoctorProfile } from './currentDoctor';

type ProfileMenuProps = {
  doctor: DoctorProfile;
};

const MENU_ITEM =
  'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-base transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#116ee6]/60';

/**
 * Avatar con el nombre del médico y un menú desplegable de cuenta.
 * Se cierra con Escape, al hacer clic fuera o al elegir una opción.
 */
export default function ProfileMenu({ doctor }: ProfileMenuProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const initials = getInitials(doctor.displayName);

  useEffect(() => {
    if (!isOpen) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isOpen]);

  // Cierra la sesión de verdad: borra la cookie del token y vuelve al login recargando (P-115, P-117).
  const handleLogout = async () => {
    setIsOpen(false);
    await logoutAndGoToLogin();
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-controls="profile-menu"
        aria-label={`Cuenta de ${doctor.displayName}`}
        className="flex items-center gap-3 rounded-none p-1 transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 sm:rounded-xl sm:py-1.5 sm:pr-3 sm:pl-1.5"
      >
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-400 text-base font-semibold text-black"
        >
          {initials || <UserRound className="h-5 w-5" />}
        </span>
        <span aria-hidden="true" className="hidden max-w-56 text-left leading-tight sm:block">
          <span className="block truncate text-base font-medium text-white">{doctor.displayName}</span>
          <span className="mt-1 block truncate text-base text-white/70">{doctor.specialty}</span>
        </span>
        <ChevronDown
          aria-hidden="true"
          className={`hidden h-4 w-4 text-white/70 transition-transform duration-200 motion-reduce:transition-none sm:block ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      <div
        id="profile-menu"
        hidden={!isOpen}
        className="absolute right-0 z-50 mt-3 w-64 rounded-xl border-2 border-slate-200 bg-white p-1.5"
      >
        <div className="border-b-2 border-slate-100 px-3 pt-1.5 pb-2.5">
          <p className="text-base font-medium text-slate-900">{doctor.displayName}</p>
          <p className="text-base text-slate-700">{doctor.specialty}</p>
        </div>
        <ul className="pt-1.5">
          {/* "Mi perfil" y "Configuración" se quitaron: no había pantallas detrás (P-115). */}
          <li className="mt-1.5 border-t-2 border-slate-100 pt-1.5">
            <button type="button" onClick={handleLogout} className={`${MENU_ITEM} text-slate-900 hover:bg-red-50`}>
              <LogOut aria-hidden="true" className="h-4 w-4" />
              Cerrar sesión
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
}
