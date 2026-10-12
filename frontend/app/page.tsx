'use client';

import { useState, FormEvent } from 'react';
import Image from 'next/image';

export default function LoginPage() {
  const [usuarioId, setUsuarioId] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuarioId, password, rememberMe }),
      });

      if (!response.ok) {
        setErrorMessage('ID o contraseña incorrectos. Vuelve a intentarlo.');
        return;
      }

      alert('¡Inicio de sesión exitoso!');
    } catch {
      setErrorMessage(
        'No se pudo iniciar sesión. Verifica tu conexión e inténtalo de nuevo.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="login-page h-dvh overflow-hidden bg-slate-100 flex items-center justify-center p-3 sm:p-4">
      <div className="login-card grid grid-cols-1 md:grid-cols-2 bg-white rounded-3xl shadow-xl w-full max-w-4xl max-h-full overflow-hidden border border-slate-200">
        <section className="login-visual relative isolate min-h-[clamp(7.5rem,18svh,10rem)] md:min-h-[min(70svh,42rem)] bg-blue-100/60 px-6 py-5 md:p-9 flex flex-col items-center justify-center text-center">
          <Image
            src="/logo-header.png"
            alt=""
            fill
            sizes="(max-width: 767px) 100vw, 50vw"
            className="absolute inset-0 -z-10 object-cover"
            priority
          />
          <div
            aria-hidden="true"
            className="login-visual-glow pointer-events-none absolute inset-0 -z-[5]"
          />
          <div className="relative z-10">
            <h1 className="login-brand-title font-bold text-slate-800 tracking-tight">
              XpertDiagnostic
            </h1>
            <p className="login-brand-subtitle text-slate-600 mt-1">
              Sistema experto para análisis médicos
            </p>
          </div>
          <div className="login-visual-art relative z-10 mt-6 md:mt-auto md:pt-8 w-full max-w-sm">
            <div className="login-illustration relative mx-auto h-[clamp(10rem,30svh,20rem)] w-full">
              <Image
                src="/footer-image.png"
                alt="Ilustración de personal médico"
                fill
                sizes="(max-width: 767px) 100vw, 40vw"
                className="object-contain scale-125"
              />
            </div>
            <p className="login-security-note mt-3 text-center text-slate-500 leading-relaxed">
              Sistema seguro de acceso restringido para personal médico autorizado.
            </p>
          </div>
        </section>

        <section className="login-content flex flex-col justify-center p-5 sm:p-8 md:p-10">
          <h2 className="login-heading font-bold text-slate-900 mb-5">
            Iniciar sesión
          </h2>

          {errorMessage && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <input
                type="text"
                placeholder="ID"
                value={usuarioId}
                onChange={(e) => setUsuarioId(e.target.value)}
                required
                className="login-input w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="login-input w-full rounded-lg border border-slate-300 py-2.5 pl-4 pr-12 text-slate-700 placeholder-slate-400 transition focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-1 bg-[#4c589c] hover:bg-[#3d4780] text-white font-medium py-2 px-3 rounded-lg shadow text-xs transition duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <svg
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-6 w-6"
                >
                  {showPassword ? (
                    <>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.9 5.2A10.8 10.8 0 0112 5c5 0 8.5 4.5 9.5 7-.4 1.1-1.3 2.4-2.6 3.5M6.2 6.2C4.3 7.5 3 9.3 2.5 12c1 2.5 4.5 7 9.5 7 1.1 0 2.1-.2 3.1-.6" />
                    </>
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z" />
                  )}
                  {!showPassword && (
                    <circle cx="12" cy="12" r="2.5" />
                  )}
                </svg>
              </button>
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-[1.125rem] w-[1.125rem] rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="remember" className="login-remember-label text-slate-600 font-medium cursor-pointer">
                Recuérdame la sesión
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="login-submit w-full mt-2 bg-[#4c589c] hover:bg-[#3d4780] text-white font-medium py-2.5 px-4 rounded-lg shadow transition duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Cargando...</span>
                </div>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

        </section>
      </div>
    </main>
  );
}