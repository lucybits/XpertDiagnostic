'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Hourglass, LogOut } from 'lucide-react';
import { getSessionState, logoutAndGoToLogin } from '@/services/doctorService';
import { HOME_ROUTE_BY_ROLE } from '@/types/auth';
import { USER_ROLES, type SessionProfile } from '@/types/doctor';

/**
 * Pantalla del médico internista (rol I, P-140). Su contenido está aplazado: por ahora solo confirma
 * la sesión y permite cerrarla. La ruta, la protección por rol y la redirección del login ya están
 * listas, así que el contenido real se agrega aquí sin tocar el resto.
 */
export default function InternistScreen() {
  const [profile, setProfile] = useState<SessionProfile | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Sesión: solo internistas. El proxy ya lo revisa; esto cubre sesiones que el backend invalidó
  // o un rol que cambió con la sesión abierta.
  useEffect(() => {
    let isActive = true;
    getSessionState().then((state) => {
      if (!isActive) return;
      if (state.status === 'unauthenticated') {
        void logoutAndGoToLogin();
      } else if (state.status === 'ok' && state.profile.rol !== USER_ROLES.internist) {
        window.location.replace(HOME_ROUTE_BY_ROLE[state.profile.rol] ?? '/login');
      } else if (state.status === 'ok') {
        setProfile(state.profile);
      }
    });
    return () => {
      isActive = false;
    };
  }, []);

  const handleLogout = () => {
    setIsLoggingOut(true);
    void logoutAndGoToLogin();
  };

  return (
    <main className="flex min-h-svh flex-col bg-slate-50">
      <header className="flex items-center justify-between gap-4 bg-[#1e3a8a] px-4 py-3 text-white sm:px-6">
        <div className="flex items-center gap-3">
          <Image src="/logoxd.png" alt="" width={36} height={36} className="h-9 w-9 shrink-0 object-contain" priority />
          <span className="text-lg font-bold">XpertDiagnostic</span>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-70"
        >
          <LogOut aria-hidden="true" className="h-4 w-4" />
          Cerrar sesión
        </button>
      </header>

      <section
        aria-labelledby="internist-title"
        className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-4 py-12 text-center"
      >
        <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
          <Hourglass aria-hidden="true" className="h-7 w-7" />
        </span>
        <h1 id="internist-title" className="mb-3 text-2xl font-bold text-slate-900 sm:text-3xl">
          {profile ? `Hola, ${profile.nombreCompleto}` : 'Médico internista'}
        </h1>
        <p className="text-base leading-relaxed text-slate-700">
          El espacio del médico internista está en preparación. Tu sesión está activa; pronto podrás
          trabajar desde aquí.
        </p>
      </section>
    </main>
  );
}
