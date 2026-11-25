'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import {
  ArrowLeft,
  ArrowRight,
  CircleAlert,
  CircleCheck,
  Hourglass,
  Inbox,
  List,
  LogOut,
  RefreshCw,
  Search,
  Stethoscope,
} from 'lucide-react';
import { getSessionState, logoutAndGoToLogin } from '@/services/doctorService';
import { confirmValidation, getValidationDetail, listValidations } from '@/services/validationService';
import { HOME_ROUTE_BY_ROLE } from '@/types/auth';
import { USER_ROLES, type SessionProfile } from '@/types/doctor';
import {
  formatValidationDate,
  VALIDATION_STATES,
  type ValidationDetail as Detail,
  type ValidationState,
  type ValidationSummary,
} from '@/types/validation';
import ValidationDetail, { BUTTON, BUTTON_PRIMARY, NAVY } from './ValidationDetail';

const TABS: readonly { state: ValidationState; label: string; icon: typeof Hourglass; empty: string }[] = [
  {
    state: VALIDATION_STATES.pending,
    label: 'Pendientes',
    icon: Hourglass,
    empty: 'No hay solicitudes pendientes de validación.',
  },
  { state: VALIDATION_STATES.confirmed, label: 'Confirmados', icon: CircleCheck, empty: 'No hay diagnósticos validados.' },
];

const SEX_LABEL: Record<string, string> = { F: 'Femenino', M: 'Masculino' };

/** Quita acentos y mayúsculas para buscar "Montaño" escribiendo "montano". */
const normalize = (text: string) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

/**
 * Pantalla del médico internista (rol I, P-140, P-151). Recibe los diagnósticos diferenciales que
 * envían los médicos tratantes, revisa los hallazgos y la propuesta de la máquina de inferencia, y
 * confirma un candidato. La lista y el expediente son vistas separadas; tras confirmar se puede pasar
 * al siguiente pendiente sin volver a la lista.
 */
export default function InternistScreen() {
  const [profile, setProfile] = useState<SessionProfile | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [tab, setTab] = useState<ValidationState>(VALIDATION_STATES.pending);
  const [items, setItems] = useState<ValidationSummary[] | null>(null);
  // Cantidad de pacientes en cada pestaña (null mientras no se ha leído).
  const [counts, setCounts] = useState<Record<ValidationState, number | null>>({ P: null, C: null });
  const [listError, setListError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  // Pacientes ya atendidos en esta visita: "Siguiente pendiente" los salta.
  const [handled, setHandled] = useState<ReadonlySet<string>>(new Set());
  const mainRef = useRef<HTMLElement>(null);

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

  const loadList = useCallback(async (state: ValidationState) => {
    setListError(null);
    const response = await listValidations(state);
    if (!response.ok) {
      setListError(response.message);
      setItems([]);
      return;
    }
    setItems(response.data);
    setHandled(new Set());
    setCounts((current) => ({ ...current, [state]: response.data.length }));
  }, []);

  useEffect(() => {
    // Carga inicial y al cambiar de pestaña: la lista llega del servidor.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadList(tab);
  }, [tab, loadList]);

  // Los dos conteos se ven siempre, aunque solo una pestaña esté abierta.
  useEffect(() => {
    for (const state of [VALIDATION_STATES.pending, VALIDATION_STATES.confirmed]) {
      void listValidations(state).then((response) => {
        if (response.ok) setCounts((current) => ({ ...current, [state]: response.data.length }));
      });
    }
  }, []);

  const visibleItems = useMemo(() => {
    const term = normalize(query.trim());
    if (!items || term === '') return items;
    return items.filter((item) => normalize(`${item.nombreCompleto} ${item.idPaciente}`).includes(term));
  }, [items, query]);

  const isPendingTab = tab === VALIDATION_STATES.pending;
  // Siguiente paciente pendiente que no se ha atendido en esta visita.
  const nextPending = isPendingTab
    ? (items ?? []).find((item) => item.idPaciente !== selectedId && !handled.has(item.idPaciente))
    : undefined;

  const openPatient = async (patientId: string) => {
    setSelectedId(patientId);
    setDetail(null);
    setDetailError(null);
    setNotice(null);
    // Al abrir un expediente se vuelve arriba: en pantallas grandes hace scroll el contenido, no la ventana.
    mainRef.current?.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });
    const response = await getValidationDetail(patientId);
    if (response.ok) setDetail(response.data);
    else setDetailError(response.message);
  };

  const backToList = () => {
    setSelectedId(null);
    setDetail(null);
    setDetailError(null);
    setNotice(null);
    setItems(null);
    void loadList(tab);
  };

  const changeTab = (state: ValidationState) => {
    if (state === tab) return;
    setTab(state);
    setQuery('');
    setItems(null);
  };

  const handleConfirm = async (diseaseId: string): Promise<string | null> => {
    if (!detail) return null;
    const patientId = detail.paciente.idPaciente;
    const response = await confirmValidation(patientId, diseaseId);
    if (!response.ok) return response.message;

    // Confirmado o corregido (P-153): el expediente queda actualizado; la lista se recarga al regresar.
    const wasPending = detail.paciente.estado === VALIDATION_STATES.pending;
    setDetail({ ...detail, paciente: response.data });
    if (wasPending) {
      setHandled((current) => new Set(current).add(patientId));
      setCounts((current) => ({
        P: current.P === null ? null : Math.max(0, current.P - 1),
        C: current.C === null ? null : current.C + 1,
      }));
    }
    const disease = response.data.diagnostico ?? 'El diagnóstico';
    setNotice(
      wasPending
        ? `Diagnóstico confirmado: ${disease}. El médico tratante ya puede verlo.`
        : `Diagnóstico corregido: ${disease}. El médico tratante ya ve el cambio.`,
    );
    return null;
  };

  const handleLogout = () => {
    setIsLoggingOut(true);
    void logoutAndGoToLogin();
  };

  const activeTab = TABS.find((t) => t.state === tab) ?? TABS[0];

  // Menú lateral: abre la lista de esa sección (también desde un expediente abierto).
  const goToSection = (state: ValidationState) => {
    if (selectedId) {
      setSelectedId(null);
      setDetail(null);
      setDetailError(null);
      setNotice(null);
    }
    if (state === tab) {
      setItems(null);
      void loadList(state);
    } else changeTab(state);
  };

  return (
    <div className="flex min-h-svh flex-col bg-white text-base text-slate-900 lg:h-svh lg:overflow-hidden">
      <header className="bg-blue-900 text-white">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Image src="/logoxd.png" alt="" width={34} height={34} className="h-9 w-9 shrink-0 object-contain" priority />
            <span className="text-lg font-bold">XpertDiagnostic</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-400 text-slate-950">
                <Stethoscope aria-hidden="true" className="h-5 w-5" />
              </span>
              <div className="leading-tight">
                <p className="font-semibold">{profile?.nombreCompleto ?? ' '}</p>
                <p className="text-sm text-white/90">Médico internista</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-70"
            >
              <LogOut aria-hidden="true" className="h-4 w-4" />
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      {/* Pantallas grandes: alto exacto de la ventana; el menú queda fijo y solo el contenido hace scroll. */}
      <div className="flex flex-1 flex-col lg:min-h-0 lg:flex-row">
        {/* Menú lateral azul marino, como el del tratante: secciones con su conteo. */}
        <nav aria-label="Secciones" className={`${NAVY} text-white lg:w-64 lg:shrink-0`}>
          <p className="hidden px-5 pt-6 pb-2 text-sm font-semibold tracking-wide text-white/70 uppercase lg:block">
            Validación de diagnósticos
          </p>
          <ul className="flex lg:block">
            {TABS.map((t) => {
              const Icon = t.icon;
              const selected = tab === t.state && !selectedId;
              const current = tab === t.state;
              const count = counts[t.state];
              return (
                <li key={t.state} className="flex-1 lg:flex-none">
                  <button
                    type="button"
                    onClick={() => goToSection(t.state)}
                    aria-current={selected ? 'page' : undefined}
                    className={`flex w-full items-center gap-3 border-b-4 px-5 py-3.5 text-left font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-inset lg:border-b-0 lg:border-l-4 ${
                      current ? 'border-teal-400 bg-white/10 text-white' : 'border-transparent text-white/85 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Icon aria-hidden="true" className={`h-5 w-5 shrink-0 ${current ? 'text-teal-300' : ''}`} />
                    <span className="flex-1">{t.label}</span>
                    <span className="tabular-nums">{count ?? '–'}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <main ref={mainRef} className="min-w-0 flex-1 px-4 py-8 sm:px-8 lg:overflow-y-auto">
          {selectedId ? (
            <>
              <button type="button" onClick={backToList} className={`mb-6 ${BUTTON}`}>
                <ArrowLeft aria-hidden="true" className="h-4 w-4" />
                Regresar a {activeTab.label.toLowerCase()}
              </button>

              {notice && (
                <div role="status" className="mb-8 flex flex-wrap items-center gap-3 rounded-lg border-2 border-green-600 bg-green-50 px-4 py-3">
                  <CircleCheck aria-hidden="true" className="h-5 w-5 shrink-0 text-green-700" />
                  <p className="flex-1 font-medium text-slate-900">{notice}</p>
                  <button type="button" onClick={backToList} className={BUTTON}>
                    <List aria-hidden="true" className="h-4 w-4" />
                    Ver la lista
                  </button>
                  {nextPending && (
                    <button type="button" onClick={() => openPatient(nextPending.idPaciente)} className={BUTTON_PRIMARY}>
                      Siguiente: {nextPending.nombreCompleto}
                      <ArrowRight aria-hidden="true" className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}

              {detailError ? (
                <p role="alert" className="flex items-start gap-2 rounded-lg border-2 border-red-500 px-4 py-2.5 text-red-800">
                  <CircleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                  {detailError}
                </p>
              ) : detail ? (
                <ValidationDetail key={detail.paciente.idPaciente} detail={detail} onConfirm={handleConfirm} />
              ) : (
                <p role="status" className="py-6 text-slate-700">
                  Cargando expediente…
                </p>
              )}
            </>
          ) : (
            <>
              {/* Título fijo de la pantalla: se queda arriba al bajar por la lista (Pendientes y Confirmados). */}
              <div className="sticky -top-8 z-10 -mx-4 -mt-8 mb-4 bg-white px-4 pt-8 pb-3 sm:-mx-8 sm:px-8">
                <h1 className="text-3xl font-bold text-[#0b1533]">Diagnósticos diferenciales</h1>
              </div>
              <div className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-[#0b1533] pb-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{activeTab.label}</h2>
                  <p className="mt-1 text-slate-700">
                    {isPendingTab
                      ? 'Solicitudes de validación remitidas por los médicos tratantes, ordenadas por fecha de envío.'
                      : 'Diagnósticos validados, ordenados por fecha de confirmación. Seleccione un registro para consultarlo o corregirlo.'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <label htmlFor="internist-search" className="sr-only">
                      Buscar paciente
                    </label>
                    <input
                      id="internist-search"
                      type="search"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Buscar paciente o expediente"
                      autoComplete="off"
                      className="w-72 max-w-full rounded-lg border-2 border-slate-400 bg-white py-2 pr-3 pl-9 text-sm text-slate-900 placeholder:text-slate-500 focus:border-blue-700 focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setItems(null);
                      void loadList(tab);
                    }}
                    className={BUTTON}
                  >
                    <RefreshCw aria-hidden="true" className="h-4 w-4" />
                    Actualizar
                  </button>
                </div>
              </div>

              {listError && (
                <p role="alert" className="mt-4 flex items-start gap-2 rounded-lg border-2 border-red-500 px-4 py-2.5 text-red-800">
                  <CircleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                  {listError}
                </p>
              )}

              {visibleItems === null ? (
                <p role="status" className="py-8 text-slate-700">
                  Cargando…
                </p>
              ) : visibleItems.length === 0 ? (
                <div className="flex items-center gap-3 py-10 text-slate-800">
                  <Inbox aria-hidden="true" className="h-6 w-6 shrink-0 text-[#1e47c5]" />
                  <p>{query.trim() ? `Ningún paciente coincide con «${query.trim()}».` : activeTab.empty}</p>
                </div>
              ) : (
                <>
                  {/* Filas separadas por líneas (sin tarjetas), con encabezado de columnas en pantallas medianas. */}
                  <div className="hidden grid-cols-[1fr_15rem_7rem] gap-6 border-b-2 border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 md:grid">
                    <span>Paciente</span>
                    <span>{isPendingTab ? 'Enviado por' : 'Diagnóstico confirmado'}</span>
                    <span className="sr-only">Acción</span>
                  </div>
                  <ul aria-label={activeTab.label} className="divide-y-2 divide-slate-300 border-b-2 border-slate-300">
                    {visibleItems.map((item) => {
                      const date = formatValidationDate(isPendingTab ? item.fechaSolicitud : item.fechaValidacion);
                      return (
                        <li
                          key={item.idPaciente}
                          className="grid items-center gap-x-6 gap-y-2 px-3 py-3.5 transition-colors hover:bg-slate-50 md:grid-cols-[1fr_15rem_7rem]"
                        >
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900">{item.nombreCompleto}</p>
                            <p className="text-sm text-slate-700">
                              <span className="font-mono">{item.idPaciente}</span> · {item.edad} años · {SEX_LABEL[item.sexo] ?? item.sexo}
                            </p>
                          </div>
                          <div className="text-sm text-slate-700">
                            {isPendingTab ? (
                              <>
                                <p className="text-slate-900">{item.solicitante ?? 'Médico tratante'}</p>
                                {date && <p>{date}</p>}
                              </>
                            ) : (
                              <>
                                <p className="flex items-center gap-1.5 font-medium text-slate-900">
                                  <CircleCheck aria-hidden="true" className="h-4 w-4 shrink-0 text-teal-700" />
                                  {item.diagnostico ?? '—'}
                                </p>
                                {date && <p>{date}</p>}
                              </>
                            )}
                          </div>
                          <div className="md:text-right">
                            <button
                              type="button"
                              onClick={() => openPatient(item.idPaciente)}
                              className={isPendingTab ? BUTTON_PRIMARY : BUTTON}
                              aria-label={`${isPendingTab ? 'Revisar' : 'Ver'} a ${item.nombreCompleto}`}
                            >
                              {isPendingTab ? 'Revisar' : 'Ver'}
                              <ArrowRight aria-hidden="true" className="h-4 w-4" />
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                  <p className="mt-3 text-sm text-slate-700">
                    {visibleItems.length} {visibleItems.length === 1 ? 'paciente' : 'pacientes'}
                  </p>
                </>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
