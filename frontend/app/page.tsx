'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Eye, EyeOff, IdCard, LockKeyhole } from 'lucide-react';

type LoginField = 'usuarioId' | 'password';
type LoginMode = 'medico' | 'administrador';
type LoginFeedback = {
  errorMessage: string | null;
  successMessage: string | null;
  invalidFields: LoginField[];
};

export default function LoginPage() {
  const [usuarioId, setUsuarioId] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loginMode, setLoginMode] = useState<LoginMode>('medico');
  const [isSectionTransitioning, setIsSectionTransitioning] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const sectionTransitionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [feedbackByMode, setFeedbackByMode] = useState<Record<LoginMode, LoginFeedback>>({
    medico: { errorMessage: null, successMessage: null, invalidFields: [] },
    administrador: { errorMessage: null, successMessage: null, invalidFields: [] },
  });
  const { errorMessage, successMessage, invalidFields } = feedbackByMode[loginMode];

  const updateLoginFeedback = (updates: Partial<LoginFeedback>) => {
    setFeedbackByMode((current) => ({
      ...current,
      [loginMode]: { ...current[loginMode], ...updates },
    }));
  };

  const clearLoginFeedback = () => {
    updateLoginFeedback({
      errorMessage: null,
      successMessage: null,
      invalidFields: [],
    });
  };

  useEffect(() => {
    return () => {
      if (sectionTransitionTimeout.current !== null) {
        clearTimeout(sectionTransitionTimeout.current);
      }
    };
  }, []);

  const handleLoginModeChange = (mode: LoginMode) => {
    if (mode === loginMode) return;

    if (sectionTransitionTimeout.current !== null) {
      clearTimeout(sectionTransitionTimeout.current);
    }

    setFeedbackByMode({
      medico: { errorMessage: null, successMessage: null, invalidFields: [] },
      administrador: { errorMessage: null, successMessage: null, invalidFields: [] },
    });
    setLoginMode(mode);
    setIsSectionTransitioning(true);
    sectionTransitionTimeout.current = setTimeout(() => {
      setIsSectionTransitioning(false);
      sectionTransitionTimeout.current = null;
    }, 250);
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
      updateLoginFeedback({
        invalidFields: missingFields,
        errorMessage: invalidId
          ? 'Ingresa un ID numérico válido.'
          : missingFields.length === 2
            ? 'Ingresa tu ID y contraseña.'
            : missingFields[0] === 'usuarioId'
              ? 'Ingresa tu ID.'
              : 'Ingresa tu contraseña.',
      });
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
          updateLoginFeedback({
            errorMessage: 'ID o contraseña incorrectos. Vuelve a intentarlo.',
            invalidFields: ['usuarioId', 'password'],
          });
        } else {
          updateLoginFeedback({
            errorMessage: 'No se pudo iniciar sesión. Inténtalo de nuevo.',
          });
        }
        return;
      }

      updateLoginFeedback({ successMessage: '¡Inicio de sesión exitoso!' });
    } catch {
      updateLoginFeedback({
        errorMessage: 'No se pudo iniciar sesión. Verifica tu conexión e inténtalo de nuevo.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-x-hidden bg-slate-100 bg-[url('/bg.png')] bg-center bg-cover bg-no-repeat px-3 pt-3 pb-7 sm:px-4 sm:pt-4 max-[767px]:justify-start">
      <div className="grid w-full max-w-4xl grid-cols-1 overflow-hidden rounded-md border border-slate-200 bg-white shadow-xl md:grid-cols-2">
        <section className="relative isolate flex min-h-[clamp(7.5rem,18svh,10rem)] flex-col items-center justify-center bg-slate-100 px-6 py-5 text-center md:min-h-[min(70svh,42rem)] md:justify-start md:p-9">
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
              <h1 className="text-[length:clamp(1.625rem,4.8svh,2rem)] font-bold tracking-tight text-slate-800">
                XpertDiagnostic
              </h1>
            </div>
            <p className="mt-1 text-[length:clamp(0.9375rem,2.7svh,1.0625rem)] text-slate-600">
              Sistema experto para análisis médicos
            </p>
          </div>
          <div className="relative z-10 mt-6 w-full max-w-sm max-[767px]:hidden md:mt-8 md:pt-8">
            <div className="relative mx-auto h-[clamp(10rem,30svh,20rem)] w-full">
              <Image
                src="/footer-image.png"
                alt="Ilustración de personal médico"
                fill
                sizes="(max-width: 767px) 100vw, 40vw"
                className="-translate-y-8 scale-150 object-contain"
              />
            </div>
            <p className="mt-3 text-center text-base leading-relaxed text-slate-500">
              Si olvidaste tu contraseña, comunícate con soporte técnico para recuperarla.
            </p>
          </div>
        </section>

        <section
          className={`flex flex-col justify-center p-5 max-[560px]:py-3 max-[460px]:py-2 sm:p-8 md:p-10 transition-[opacity,transform] duration-250 ease-in-out motion-reduce:transition-none ${
            isSectionTransitioning
              ? 'scale-[0.995] opacity-75 motion-reduce:scale-100 motion-reduce:opacity-100'
              : 'scale-100 opacity-100'
          }`}
        >
          <fieldset className="mb-5">
            <legend className="sr-only">Tipo de cuenta</legend>
            <div className="relative grid grid-cols-2 rounded-xl bg-slate-100 p-1">
              <span
                aria-hidden="true"
                className={`pointer-events-none absolute inset-y-1 left-1 w-[calc(50%_-_0.25rem)] rounded-lg bg-[#5f77ff] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                  loginMode === 'administrador' ? 'translate-x-full' : 'translate-x-0'
                }`}
              />
              <label className="relative z-10 cursor-pointer">
                <input
                  type="radio"
                  name="loginMode"
                  value="medico"
                  checked={loginMode === 'medico'}
                  onChange={() => handleLoginModeChange('medico')}
                  className="peer sr-only"
                />
                <span className={`block rounded-lg px-3 py-2 text-center text-base font-semibold transition-colors duration-200 peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-500 ${
                  loginMode === 'medico' ? 'text-white' : 'text-slate-600'
                }`}>
                  Médico
                </span>
              </label>
              <label className="relative z-10 cursor-pointer">
                <input
                  type="radio"
                  name="loginMode"
                  value="administrador"
                  checked={loginMode === 'administrador'}
                  onChange={() => handleLoginModeChange('administrador')}
                  className="peer sr-only"
                />
                <span className={`block rounded-lg px-3 py-2 text-center text-base font-semibold transition-colors duration-200 peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-500 ${
                  loginMode === 'administrador' ? 'text-white' : 'text-slate-600'
                }`}>
                  Administrador
                </span>
              </label>
            </div>
          </fieldset>

          <h2 className="mb-5 text-[length:clamp(1.5rem,3.9svh,1.75rem)] font-bold text-slate-900 max-[560px]:mb-3 max-[460px]:mb-2">
            Iniciar sesión
          </h2>

          <div
            id="login-error"
            role="alert"
            aria-hidden={!errorMessage}
            className={`overflow-hidden rounded-lg bg-red-600 text-[length:clamp(0.9375rem,2.6svh,1rem)] text-white ${
              errorMessage
                ? 'mb-4 max-h-24 translate-y-0 p-3 opacity-100 transition-[max-height,opacity,transform,margin,padding] duration-250 ease-out motion-reduce:transition-none'
                : 'pointer-events-none mb-0 max-h-0 translate-y-1 p-0 opacity-0'
            }`}
          >
            {errorMessage}
          </div>
          {successMessage && (
            <div id="login-success" role="status" className="mb-4 rounded-lg bg-green-600 p-3 text-[length:clamp(0.9375rem,2.6svh,1rem)] text-white">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-3 max-[560px]:space-y-2">
            <div className="relative">
              <IdCard
                aria-hidden="true"
                className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={10}
                autoComplete="username"
                placeholder={loginMode === 'medico' ? 'ID médico' : 'ID administrador'}
                value={usuarioId}
                onChange={(e) => {
                  const soloDigitos = e.target.value.replace(/\D/g, '');
                  setUsuarioId(soloDigitos);
                  clearLoginFeedback();
                }}


                required
                aria-invalid={invalidFields.includes('usuarioId')}
                aria-describedby={errorMessage ? 'login-error' : successMessage ? 'login-success' : undefined}
                className={`w-full min-h-[clamp(2.75rem,8svh,3rem)] rounded-lg border-2 py-2.5 pl-12 pr-4 text-[length:clamp(1rem,2.8svh,1.125rem)] text-slate-700 placeholder-slate-400 transition focus:outline-none focus:ring-2 ${
                  invalidFields.includes('usuarioId')
                    ? 'border-red-600 focus:ring-red-500'
                    : successMessage
                      ? 'border-green-600 focus:ring-green-500'
                      : 'border-slate-300 focus:ring-indigo-500'
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
                className={`w-full min-h-[clamp(2.75rem,8svh,3rem)] rounded-lg border-2 py-2.5 pl-12 pr-12 text-[length:clamp(1rem,2.8svh,1.125rem)] text-slate-700 placeholder-slate-400 transition focus:outline-none focus:ring-2 ${
                  invalidFields.includes('password')
                    ? 'border-red-600 focus:ring-red-500'
                    : successMessage
                      ? 'border-green-600 focus:ring-green-500'
                      : 'border-slate-300 focus:ring-indigo-500'
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
              <label htmlFor="remember" className="cursor-pointer text-[length:clamp(0.9375rem,2.7svh,1rem)] font-medium text-slate-600">
                Recuérdame la sesión
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 flex min-h-[clamp(2.875rem,8svh,3.125rem)] w-full cursor-pointer items-center justify-center rounded-lg bg-[#4c589c] px-4 py-2.5 text-[length:clamp(1.0625rem,3.2svh,1.1875rem)] font-medium text-white shadow transition duration-200 hover:bg-[#3d4780] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <svg className="h-5 w-5 animate-spin text-white" viewBox="0 0 24 24">
                    <circle className="fill-none stroke-current stroke-4 opacity-25" cx="12" cy="12" r="10"></circle>
                    <path className="fill-current opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Cargando...</span>
                </div>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-[length:clamp(0.9375rem,2.6svh,1rem)] text-slate-500">
            <span className="cursor-pointer underline decoration-slate-300 underline-offset-4 transition-colors hover:text-indigo-600 hover:decoration-indigo-500">
              Términos y privacidad
            </span>
            <span className="cursor-pointer underline decoration-slate-300 underline-offset-4 transition-colors hover:text-indigo-600 hover:decoration-indigo-500">
              Recuperar contraseña
            </span>
          </div>
          <p className="mt-6 mb-4 text-center text-base leading-relaxed text-slate-500 md:hidden">
            Si olvidaste tu contraseña, comunícate con soporte técnico para recuperarla.
          </p>
        </section>
      </div>
      <footer className="mt-3 text-center text-base text-white max-[767px]:mt-4">
        © XpertDiagnostic
      </footer>
    </main>
  );
}