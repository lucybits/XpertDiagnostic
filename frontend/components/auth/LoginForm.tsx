'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, IdCard, LockKeyhole } from 'lucide-react';
import LoadingDots from '@/components/ui/LoadingDots';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import { initialLoginState, type LoginState } from '@/lib/loginState';
import { validateLoginInput } from '@/lib/loginValidation';
import { login } from '@/services/authService';
import { HOME_ROUTE_BY_ROLE, LOGIN_LIMITS, type LoginFailureReason, type LoginMode } from '@/types/auth';

const FAILURE_MESSAGES: Record<LoginFailureReason, string> = {
  'invalid-credentials': 'ID o contraseña incorrectos. Vuelve a intentarlo.',
  forbidden: 'Esta cuenta no puede entrar desde este apartado.',
  'invalid-request': 'Revisa tu ID y contraseña e inténtalo de nuevo.',
  unavailable: 'No se pudo iniciar sesión. Inténtalo de nuevo.',
  network: 'No se pudo iniciar sesión. Verifica tu conexión e inténtalo de nuevo.',
};

const SUCCESS_MESSAGE = '¡Inicio de sesión exitoso!';

const DEFAULT_ROUTE = '/home';
// Simulación temporal: espera fija antes de ir a la pantalla principal.
// Se reemplazará cuando la pantalla principal cargue sus propios datos.
const SIMULATED_REDIRECT_DELAY_MS = 5000;

/**
 * Vista del formulario de inicio de sesión. Es el "contexto" del patrón Estado: guarda el
 * LoginState actual y le delega cada evento (enviar, fallar, tener éxito, editar).
 * La comunicación con el servidor la hace services/authService.
 */
export default function LoginForm() {
  const [usuarioId, setUsuarioId] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loginMode, setLoginMode] = useState<LoginMode>('medico');
  const [isSectionTransitioning, setIsSectionTransitioning] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  // Pantalla a la que lleva el inicio de sesión: /home para médicos, /admin para administradores (P-116).
  const [destination, setDestination] = useState<string>(DEFAULT_ROUTE);
  const sectionTransitionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [loginState, setLoginState] = useState<LoginState>(initialLoginState);
  const { errorMessage, successMessage, invalidFields, isLoading } = loginState;

  // Conserva el último error para que el texto siga visible mientras la alerta se oculta con animación.
  const [lastErrorMessage, setLastErrorMessage] = useState<string | null>(null);
  if (errorMessage && errorMessage !== lastErrorMessage) {
    setLastErrorMessage(errorMessage);
  }

  const router = useRouter();
  const isRedirecting = loginState.kind === 'success';

  const editLogin = () => setLoginState((current) => current.edit());

  useEffect(() => {
    return () => {
      if (sectionTransitionTimeout.current !== null) {
        clearTimeout(sectionTransitionTimeout.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isRedirecting) return;

    router.prefetch(destination);
    const redirectTimeout = setTimeout(
      () => router.replace(destination),
      SIMULATED_REDIRECT_DELAY_MS,
    );

    return () => clearTimeout(redirectTimeout);
  }, [isRedirecting, router, destination]);

  const handleLoginModeChange = (mode: LoginMode) => {
    if (mode === loginMode || isLoading) return;

    if (sectionTransitionTimeout.current !== null) {
      clearTimeout(sectionTransitionTimeout.current);
    }

    editLogin();
    setLoginMode(mode);
    setIsSectionTransitioning(true);
    sectionTransitionTimeout.current = setTimeout(() => {
      setIsSectionTransitioning(false);
      sectionTransitionTimeout.current = null;
    }, 250);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!loginState.canSubmit) return;

    const validation = validateLoginInput(usuarioId, password);
    if (!validation.valid) {
      setLoginState((current) => current.fail(validation.message, validation.invalidFields));
      return;
    }

    setLoginState((current) => current.submit());

    const result = await login({ usuarioId: validation.usuarioId, password, rememberMe, modo: loginMode });

    if (result.ok) setDestination(HOME_ROUTE_BY_ROLE[result.session.rol] ?? DEFAULT_ROUTE);

    setLoginState((current) => {
      if (result.ok) return current.succeed(SUCCESS_MESSAGE);
      const message = (result.reason === 'forbidden' && result.message) || FAILURE_MESSAGES[result.reason];
      if (result.reason === 'invalid-credentials') return current.fail(message, ['usuarioId', 'password']);
      if (result.reason === 'forbidden') return current.fail(message, ['usuarioId']);
      return current.fail(message);
    });
  };

  const idLabel = loginMode === 'medico' ? 'ID médico' : 'ID administrador';
  const feedbackId = errorMessage ? 'login-error' : successMessage ? 'login-success' : undefined;

  return (
    <>
    {isRedirecting && (
      <LoadingOverlay
        message={
          destination === HOME_ROUTE_BY_ROLE.A
            ? 'Inicio de sesión exitoso. Cargando el panel de administración…'
            : 'Inicio de sesión exitoso. Cargando la pantalla principal…'
        }
      />
    )}
    <section
      aria-labelledby="login-title"
      inert={isRedirecting}
      className={`flex flex-col justify-center p-5 max-[560px]:py-3 max-[460px]:py-2 sm:p-8 lg:p-10 transition-[opacity,transform] duration-250 ease-in-out motion-reduce:transition-none ${
        isSectionTransitioning
          ? 'scale-[0.995] opacity-75 motion-reduce:scale-100 motion-reduce:opacity-100'
          : 'scale-100 opacity-100'
      }`}
    >
      <fieldset className="mb-5" disabled={isLoading}>
        <legend className="sr-only">Tipo de cuenta</legend>
        <div className="relative grid grid-cols-2 rounded-xl bg-slate-100 p-1">
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute inset-y-1 left-1 w-[calc(50%_-_0.25rem)] rounded-lg bg-[#116ee6] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
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
            <span className={`block rounded-lg px-3 py-2 text-center text-base font-semibold transition-colors duration-200 peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-teal-500 ${
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
            <span className={`block rounded-lg px-3 py-2 text-center text-base font-semibold transition-colors duration-200 peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-teal-500 ${
              loginMode === 'administrador' ? 'text-white' : 'text-slate-700'
            }`}>
              Administrador
            </span>
          </label>
        </div>
      </fieldset>

      <h2 id="login-title" className="mb-5 text-[length:clamp(1.5rem,3.9svh,1.75rem)] font-bold text-slate-900 max-[560px]:mb-3 max-[460px]:mb-2">
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
        {errorMessage ?? lastErrorMessage}
      </div>
      {successMessage && (
        <div id="login-success" role="status" className="mb-4 rounded-lg bg-green-700 p-3 text-[length:clamp(0.9375rem,2.6svh,1rem)] text-white">
          {successMessage}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        noValidate
        aria-busy={isLoading}
        className="space-y-3 max-[560px]:space-y-2"
      >
        <div className="relative">
          <label htmlFor="login-usuario-id" className="sr-only">
            {idLabel}
          </label>
          <IdCard
            aria-hidden="true"
            className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500"
          />
          <input
            id="login-usuario-id"
            name="usuarioId"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={LOGIN_LIMITS.maxUsuarioIdDigits}
            autoComplete="username"
            placeholder={idLabel}
            value={usuarioId}
            onChange={(e) => {
              const soloDigitos = e.target.value.replace(/\D/g, '');
              setUsuarioId(soloDigitos);
              editLogin();
            }}
            required
            aria-required="true"
            aria-invalid={invalidFields.includes('usuarioId')}
            aria-describedby={feedbackId}
            className={`w-full min-h-[clamp(2.75rem,8svh,3rem)] rounded-lg border-2 py-2.5 pl-12 pr-4 text-[length:clamp(1rem,2.8svh,1.125rem)] text-slate-700 placeholder-slate-500 transition duration-250 ease-out focus:outline-none ${
              invalidFields.includes('usuarioId')
                ? 'border-red-600 focus:ring-0'
                : successMessage
                  ? 'border-green-600 focus:ring-2 focus:ring-green-500'
                  : 'border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/40'
            }`}
          />
        </div>

        <div className="relative">
          <label htmlFor="login-password" className="sr-only">
            Contraseña
          </label>
          <LockKeyhole
            aria-hidden="true"
            className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500"
          />
          <input
            id="login-password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Contraseña"
            autoComplete="current-password"
            maxLength={LOGIN_LIMITS.maxPasswordLength}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              editLogin();
            }}
            required
            aria-required="true"
            aria-invalid={invalidFields.includes('password')}
            aria-describedby={feedbackId}
            className={`login-password-input w-full min-h-[clamp(2.75rem,8svh,3rem)] rounded-lg border-2 py-2.5 pl-12 pr-12 text-[length:clamp(1rem,2.8svh,1.125rem)] text-slate-700 placeholder-slate-500 transition duration-250 ease-out focus:outline-none ${
              invalidFields.includes('password')
                ? 'border-red-600 focus:ring-0'
                : successMessage
                  ? 'border-green-600 focus:ring-2 focus:ring-green-500'
                  : 'border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/40'
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            aria-pressed={showPassword}
            aria-controls="login-password"
            className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-600 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-teal-500"
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
            name="rememberMe"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-[1.125rem] w-[1.125rem] rounded border-slate-300 accent-teal-500 focus:ring-teal-500"
          />
          <label htmlFor="remember" className="cursor-pointer text-[length:clamp(0.9375rem,2.7svh,1rem)] font-medium text-slate-700">
            Recuérdame la sesión
          </label>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          aria-disabled={isLoading}
          className="mt-2 flex min-h-[clamp(2.875rem,8svh,3.125rem)] w-full cursor-pointer items-center justify-center rounded-lg bg-teal-700 px-4 py-2.5 text-[length:clamp(1.0625rem,3.2svh,1.1875rem)] font-semibold text-white transition duration-200 hover:bg-teal-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? (
            <LoadingDots />
          ) : (
            'Entrar'
          )}
        </button>
      </form>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-[length:clamp(0.9375rem,2.6svh,1rem)] text-slate-700">
        <span className="cursor-pointer underline decoration-slate-500 underline-offset-4 transition-colors hover:text-teal-700 hover:decoration-teal-500">
          Términos y privacidad
        </span>
        <span className="cursor-pointer underline decoration-slate-500 underline-offset-4 transition-colors hover:text-teal-700 hover:decoration-teal-500">
          Recuperar contraseña
        </span>
      </div>
      <p className="mt-6 mb-4 text-center text-base leading-relaxed text-slate-700 max-[560px]:mt-3 max-[560px]:mb-2 max-[460px]:text-sm lg:hidden">
        Si olvidaste tu contraseña, comunícate con soporte técnico para recuperarla.
      </p>
    </section>
    </>
  );
}
