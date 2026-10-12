'use client';

import { useState, FormEvent } from 'react';
import Image from 'next/image';
import { Eye, EyeOff, IdCard, LockKeyhole } from 'lucide-react';

type LoginField = 'usuarioId' | 'password';

export default function LoginPage() {
  const [usuarioId, setUsuarioId] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [invalidFields, setInvalidFields] = useState<LoginField[]>([]);

  const clearLoginFeedback = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setInvalidFields([]);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearLoginFeedback();

    const normalizedUsuarioId = usuarioId.trim();
    const parsedUsuarioId = Number(normalizedUsuarioId);
    const invalidId =
      normalizedUsuarioId.length > 0 &&
      (!/^\d+$/.test(normalizedUsuarioId) ||
        !Number.isSafeInteger(parsedUsuarioId) ||
        parsedUsuarioId < 1 ||
        parsedUsuarioId > 2147483647);
    const missingFields: LoginField[] = [];
    if (!normalizedUsuarioId || invalidId) missingFields.push('usuarioId');
    if (!password) missingFields.push('password');

    if (missingFields.length > 0) {
      setInvalidFields(missingFields);
      setErrorMessage(
        invalidId
          ? 'Ingresa un ID numérico válido.'
          : missingFields.length === 2
            ? 'Ingresa tu ID y contraseña.'
            : missingFields[0] === 'usuarioId'
              ? 'Ingresa tu ID.'
              : 'Ingresa tu contraseña.',
      );
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuarioId: parsedUsuarioId, password }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          setErrorMessage('ID o contraseña incorrectos. Vuelve a intentarlo.');
          setInvalidFields(['usuarioId', 'password']);
        } else {
          setErrorMessage('No se pudo iniciar sesión. Inténtalo de nuevo.');
        }
        return;
      }

      setSuccessMessage('¡Inicio de sesión exitoso!');
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
            <div className="flex items-center justify-center gap-3">
              <Image
                src="/logoxd.png"
                alt=""
                width={52}
                height={52}
                className="h-10 w-10 shrink-0 object-contain md:h-12 md:w-12"
                priority
              />
              <h1 className="login-brand-title font-bold text-slate-800 tracking-tight">
                XpertDiagnostic
              </h1>
            </div>
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
                className="object-contain -translate-y-8 scale-150"
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
            <div id="login-error" role="alert" className="login-error-message mb-4 rounded-lg bg-red-600 p-3 text-white">
              {errorMessage}
            </div>
          )}
          {successMessage && (
            <div id="login-success" role="status" className="login-success-message mb-4 rounded-lg bg-green-600 p-3 text-white">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-3">
            <div className="relative">
              <IdCard
                aria-hidden="true"
                className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="ID"
                value={usuarioId}
                onChange={(e) => {
                  setUsuarioId(e.target.value);
                  clearLoginFeedback();
                }}
                required
                aria-invalid={invalidFields.includes('usuarioId')}
                aria-describedby={errorMessage ? 'login-error' : successMessage ? 'login-success' : undefined}
                className={`login-input w-full rounded-lg py-2.5 pl-12 pr-4 text-slate-700 placeholder-slate-400 transition focus:outline-none focus:ring-2 ${
                  invalidFields.includes('usuarioId')
                    ? 'border-2 border-red-600 focus:ring-red-500'
                    : successMessage
                      ? 'border-2 border-green-600 focus:ring-green-500'
                      : 'border-2 border-slate-300 focus:ring-indigo-500'
                }`}
              />
            </div>

            <div className="relative">
              <LockKeyhole
                aria-hidden="true"
                className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
              />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Contraseña"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearLoginFeedback();
                }}
                required
                aria-invalid={invalidFields.includes('password')}
                aria-describedby={errorMessage ? 'login-error' : successMessage ? 'login-success' : undefined}
                className={`login-input w-full rounded-lg py-2.5 pl-12 pr-12 text-slate-700 placeholder-slate-400 transition focus:outline-none focus:ring-2 ${
                  invalidFields.includes('password')
                    ? 'border-2 border-red-600 focus:ring-red-500'
                    : successMessage
                      ? 'border-2 border-green-600 focus:ring-green-500'
                      : 'border-2 border-slate-300 focus:ring-indigo-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                aria-pressed={showPassword}
                className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              >
                {showPassword ? (
                  <EyeOff aria-hidden="true" className="h-5 w-5" />
                ) : (
                  <Eye aria-hidden="true" className="h-5 w-5" />
                )}
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

          <div className="login-secondary-links mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-slate-500">
            <span className="cursor-pointer underline decoration-slate-300 underline-offset-4 transition-colors hover:text-indigo-600 hover:decoration-indigo-500">
              Términos y privacidad
            </span>
            <span className="cursor-pointer underline decoration-slate-300 underline-offset-4 transition-colors hover:text-indigo-600 hover:decoration-indigo-500">
              Recuperar contraseña
            </span>
          </div>

        </section>
      </div>
    </main>
  );
}