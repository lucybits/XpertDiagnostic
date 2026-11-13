'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Eye, EyeOff, IdCard, LockKeyhole } from 'lucide-react';
import LoadingDots from '../../../components/ui/LoadingDots';

type LoginField = 'usuarioId' | 'password';
type LoginMode = 'medico' | 'administrador';
type LoginFeedback = {
  errorMessage: string | null;
  successMessage: string | null;
  invalidFields: LoginField[];
};

export default function LoginPage() {
  const [isBackgroundRevealed, setIsBackgroundRevealed] = useState<boolean>(false);
  const [isLoginRevealed, setIsLoginRevealed] = useState<boolean>(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);
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
  const [displayedErrorMessage, setDisplayedErrorMessage] = useState<string | null>(null);
  const errorMessageDismissTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { errorMessage, successMessage, invalidFields } = feedbackByMode[loginMode];

  useEffect(() => {
    const shouldReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setPrefersReducedMotion(shouldReduceMotion);

    const backgroundRevealTimeout = setTimeout(
      () => setIsBackgroundRevealed(true),
      shouldReduceMotion ? 0 : 2200,
    );
    const loginRevealTimeout = setTimeout(
      () => setIsLoginRevealed(true),
      shouldReduceMotion ? 0 : 4200,
    );

    return () => {
      clearTimeout(backgroundRevealTimeout);
      clearTimeout(loginRevealTimeout);
    };
  }, []);

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
      if (errorMessageDismissTimeout.current !== null) {
        clearTimeout(errorMessageDismissTimeout.current);
      }
    };
  }, []);

  useEffect(() => {
    if (errorMessageDismissTimeout.current !== null) {
      clearTimeout(errorMessageDismissTimeout.current);
      errorMessageDismissTimeout.current = null;
    }

    if (errorMessage) {
      setDisplayedErrorMessage(errorMessage);
    } else if (displayedErrorMessage) {
      errorMessageDismissTimeout.current = setTimeout(() => {
        setDisplayedErrorMessage(null);
        errorMessageDismissTimeout.current = null;
      }, 250);
    }
  }, [errorMessage, displayedErrorMessage]);

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
    <main
      className={`relative isolate flex min-h-dvh flex-col items-center bg-white px-3 pt-3 pb-7 sm:px-4 sm:pt-4 ${
        isLoginRevealed
          ? 'h-auto justify-center overflow-x-hidden'
          : 'h-dvh justify-center overflow-hidden'
      }`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 bg-[url('/bg.png')] bg-center bg-cover bg-no-repeat"
        style={{
          clipPath: isBackgroundRevealed ? 'circle(150vmax at 50% 50%)' : 'circle(0 at 50% 50%)',
          transition: prefersReducedMotion
            ? 'none'
            : 'clip-path 900ms cubic-bezier(0.76, 0, 0.24, 1)',
        }}
      />
      <div
        className={`relative z-10 flex w-full max-w-4xl flex-col items-center ${
          isLoginRevealed ? 'flex-none' : 'flex-1 justify-center'
        }`}
      >
        <h1
          aria-label="XpertDiagnostic"
          className={`absolute left-1/2 z-20 w-max max-w-[calc(100vw-2rem)] whitespace-nowrap text-center leading-none font-bold tracking-wide text-white drop-shadow ${
            isLoginRevealed
              ? 'text-base sm:text-lg'
              : 'text-[clamp(1.5rem,6vw,2.25rem)]'
          }`}
          style={{
            top: isLoginRevealed ? '0' : '50%',
            transform: isLoginRevealed
              ? 'translate(-50%, 0)'
              : 'translate(-50%, -50%)',
            color: isBackgroundRevealed ? '#fff' : '#0f172a',
            transition: prefersReducedMotion
              ? 'none'
              : 'top 900ms cubic-bezier(0.22, 1, 0.36, 1), transform 900ms cubic-bezier(0.22, 1, 0.36, 1), font-size 900ms cubic-bezier(0.22, 1, 0.36, 1), color 400ms ease 250ms',
          }}
        >
          {'XpertDiagnostic'.split('').map((character, index) => (
            <span
              key={`${character}-${index}`}
              aria-hidden="true"
              className="splash-letter inline-block animate-splash-letter motion-reduce:animate-none"
              style={{ animationDelay: `${index * 65}ms` }}
            >
              {character}
            </span>
          ))}
        </h1>

        <div
          aria-hidden="true"
          className={isLoginRevealed ? 'h-5 w-full shrink-0' : 'hidden'}
        />

        <div
          aria-hidden={!isLoginRevealed}
          inert={!isLoginRevealed}
          className={`mt-3 grid w-full max-w-4xl grid-cols-1 overflow-hidden rounded-md border border-slate-200 bg-white shadow-xl transition-[opacity,transform] duration-[800ms] delay-100 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none lg:grid-cols-2 ${
            isLoginRevealed
              ? 'relative translate-y-0 opacity-100'
              : 'pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 translate-y-6 opacity-0'
          }`}
        >
        <section className="relative isolate flex min-h-[clamp(7.5rem,18svh,10rem)] flex-col items-center justify-center bg-slate-100 px-6 py-5 text-center lg:min-h-[min(70svh,42rem)] lg:justify-start lg:p-9">
          <div className="relative z-10 flex flex-col items-center justify-center">
            <Image
              src="/logoxd.png"
              alt=""
              width={56}
              height={56}
              className="h-12 w-12 shrink-0 object-contain lg:h-14 lg:w-14"
              priority
            />
            <p className="mt-1 text-[length:clamp(0.9375rem,2.7svh,1.0625rem)] text-slate-700">
              Sistema experto para análisis médicos
            </p>
          </div>
          <div className="relative z-10 mt-6 w-full max-w-sm max-[1023px]:hidden lg:mt-8 lg:pt-8">
            <div className="relative mx-auto h-[clamp(10rem,30svh,20rem)] w-full">
              <Image
                src="/footer-image.png"
                alt="Ilustración de personal médico"
                fill
                sizes="(max-width: 1023px) 100vw, 448px"
                className="-translate-y-8 scale-150 object-contain"
              />
            </div>
            <p className="mt-3 text-center text-base leading-relaxed text-slate-700">
              Si olvidaste tu contraseña, comunícate con soporte técnico para recuperarla.
            </p>
          </div>
        </section>

        <section
          className={`flex flex-col justify-center p-5 max-[560px]:py-3 max-[460px]:py-2 sm:p-8 lg:p-10 transition-[opacity,transform] duration-250 ease-in-out motion-reduce:transition-none ${
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
                className={`pointer-events-none absolute inset-y-1 left-1 w-[calc(50%_-_0.25rem)] rounded-lg bg-[#4c589c] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
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
                  loginMode === 'medico' ? 'text-white' : 'text-slate-700'
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
                  loginMode === 'administrador' ? 'text-white' : 'text-slate-700'
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
            className={`overflow-hidden rounded-lg bg-red-600 text-[length:clamp(0.9375rem,2.6svh,1rem)] text-white transition-[max-height,opacity,transform,margin,padding] duration-250 ease-out motion-reduce:transition-none ${
              errorMessage
                ? 'mb-4 max-h-24 translate-y-0 p-3 opacity-100'
                : 'pointer-events-none mb-0 max-h-0 translate-y-1 p-0 opacity-0'
            }`}
          >
            {displayedErrorMessage ?? errorMessage}
          </div>
          {successMessage && (
            <div id="login-success" role="status" className="mb-4 rounded-lg bg-green-700 p-3 text-[length:clamp(0.9375rem,2.6svh,1rem)] text-white">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-3 max-[560px]:space-y-2">
            <div className="relative">
              <IdCard
                aria-hidden="true"
                className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500"
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
                className={`w-full min-h-[clamp(2.75rem,8svh,3rem)] rounded-lg border-2 py-2.5 pl-12 pr-4 text-[length:clamp(1rem,2.8svh,1.125rem)] text-slate-700 placeholder-slate-500 transition duration-250 ease-out focus:outline-none ${
                  invalidFields.includes('usuarioId')
                    ? 'border-red-600 focus:ring-0'
                    : successMessage
                      ? 'border-green-600 focus:ring-2 focus:ring-green-500'
                      : 'border-slate-300 focus:ring-2 focus:ring-indigo-500'
                }`}
              />
            </div>

            <div className="relative">
              <LockKeyhole
                aria-hidden="true"
                className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500"
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
                className={`login-password-input w-full min-h-[clamp(2.75rem,8svh,3rem)] rounded-lg border-2 py-2.5 pl-12 pr-12 text-[length:clamp(1rem,2.8svh,1.125rem)] text-slate-700 placeholder-slate-500 transition duration-250 ease-out focus:outline-none ${
                  invalidFields.includes('password')
                    ? 'border-red-600 focus:ring-0'
                    : successMessage
                      ? 'border-green-600 focus:ring-2 focus:ring-green-500'
                      : 'border-slate-300 focus:ring-2 focus:ring-indigo-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                aria-pressed={showPassword}
                className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-600 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
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
              <label htmlFor="remember" className="cursor-pointer text-[length:clamp(0.9375rem,2.7svh,1rem)] font-medium text-slate-700">
                Recuérdame la sesión
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 flex min-h-[clamp(2.875rem,8svh,3.125rem)] w-full cursor-pointer items-center justify-center rounded-lg bg-[#4c589c] px-4 py-2.5 text-[length:clamp(1.0625rem,3.2svh,1.1875rem)] font-medium text-white shadow transition duration-200 hover:bg-[#3d4780] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? (
                <LoadingDots />
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-[length:clamp(0.9375rem,2.6svh,1rem)] text-slate-700">
            <span className="cursor-pointer underline decoration-slate-500 underline-offset-4 transition-colors hover:text-indigo-700 hover:decoration-indigo-600">
              Términos y privacidad
            </span>
            <span className="cursor-pointer underline decoration-slate-500 underline-offset-4 transition-colors hover:text-indigo-700 hover:decoration-indigo-600">
              Recuperar contraseña
            </span>
          </div>
          <p className="mt-6 mb-4 text-center text-base leading-relaxed text-slate-700 max-[560px]:mt-3 max-[560px]:mb-2 max-[460px]:text-sm lg:hidden">
            Si olvidaste tu contraseña, comunícate con soporte técnico para recuperarla.
          </p>
        </section>
        </div>
      </div>
    </main>
  );
}