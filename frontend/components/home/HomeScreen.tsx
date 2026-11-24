'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';
import { CLINICAL_SECTION_GROUPS, buildSectionGroups, sectionsWithData } from './clinicalSections';
import { MOCK_DOCTOR, toDoctorProfile, type DoctorProfile } from './currentDoctor';
import AssistantChat from '@/components/assistant/AssistantChat';
import PatientRecordPanel from './PatientRecordPanel';
import PatientSearchDialog from './PatientSearchDialog';
import { listPatients } from '@/services/patientService';
import { getRecord } from '@/services/recordService';
import { getSessionState, logoutAndGoToLogin, markWelcomeSeen } from '@/services/doctorService';
import { HOME_ROUTE_BY_ROLE } from '@/types/auth';
import { USER_ROLES, type SessionProfile } from '@/types/doctor';
import type { Patient } from '@/types/patient';
import type { DiagnosisResult, PatientRecord } from '@/types/record';
import type { FindingType, PatientFinding } from './PatientRecordPanel';

/**
 * Vista de la pantalla principal (en construcción).
 * Aquí se agregarán los componentes de la interfaz de entrada, como el chat de IA.
 */
export default function HomeScreen() {
  const firstSectionId = CLINICAL_SECTION_GROUPS[0].sections[0].id;
  const [activeSectionId, setActiveSectionId] = useState<string>(firstSectionId);
  // Secciones completadas del paciente actual; de ahí salen los estados (P-103): las completadas,
  // la primera sin completar en proceso y las demás bloqueadas.
  const [completedSections, setCompletedSections] = useState<ReadonlySet<string>>(() => new Set());
  const sectionGroups = useMemo(() => buildSectionGroups(completedSections), [completedSections]);
  // Expediente capturado (entradas) y último análisis (salida provisional) del paciente actual.
  const [patientRecord, setPatientRecord] = useState<PatientRecord | null>(null);
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  // El análisis quedó desactualizado: se guardaron hallazgos después de hacerlo (P-112).
  const [isDiagnosisStale, setIsDiagnosisStale] = useState(false);
  // Paciente pedido en la URL (?paciente=ID), p. ej. al volver de la interfaz de salida (P-105).
  const requestedPatientRef = useRef<string | null>(null);
  // ?buscar=1: abrir el buscador en cuanto se confirme la sesión. El alta de pacientes la hace el
  // administrador (P-144), así que el tratante solo busca y captura.
  const wantsSearchRef = useRef(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isPatientSearchOpen, setIsPatientSearchOpen] = useState<boolean>(false);
  // Pacientes de la base de datos (PACIENTES), para el buscador (P-102).
  const [patients, setPatients] = useState<readonly Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [doctor, setDoctor] = useState<DoctorProfile>(MOCK_DOCTOR);
  // Perfil de la sesión: undefined mientras se consulta; null si no hay sesión.
  const [session, setSession] = useState<SessionProfile | null | undefined>(undefined);
  // Cajón del expediente (pantallas menores a xl; en xl el panel siempre está visible).
  const [isRecordOpen, setIsRecordOpen] = useState<boolean>(false);
  const [isChatHeaderCollapsed, setIsChatHeaderCollapsed] = useState<boolean>(false);
  // Barra superior y expediente plegados (P-75), cada uno con su propio estilo.
  const [isTopbarCollapsed, setIsTopbarCollapsed] = useState<boolean>(false);
  const [isRecordCollapsed, setIsRecordCollapsed] = useState<boolean>(false);

  // Vuelve a leer los pacientes de la base de datos; si falla, conserva la lista anterior.
  const refreshPatients = () => {
    void listPatients().then((result) => {
      if (result.ok) setPatients(result.patients);
    });
  };

  // Nombre y especialidad del médico con sesión; mientras tanto (o sin sesión) se ven los indicadores.
  // Con sesión, se cargan también los pacientes registrados.
  useEffect(() => {
    let isActive = true;
    // Enlaces desde la interfaz de salida: ?paciente=ID abre ese paciente; ?buscar=1 abre el buscador.
    const query = new URLSearchParams(window.location.search);
    // El efecto puede ejecutarse dos veces (Strict Mode en desarrollo, o al volver a mostrarse la
    // pantalla): la segunda vez la URL ya está limpia, así que solo se anota lo que sí venga (P-108).
    const requested = query.get('paciente');
    if (requested) requestedPatientRef.current = requested;
    if (query.get('buscar') === '1') wantsSearchRef.current = true;
    if (query.size > 0) window.history.replaceState(null, '', window.location.pathname);
    getSessionState().then((state) => {
      if (!isActive) return;
      // Sesión que el backend ya no acepta (vencida, cuenta desactivada): de vuelta al login (P-116).
      if (state.status === 'unauthenticated') {
        void logoutAndGoToLogin();
        return;
      }
      const profile = state.status === 'ok' ? state.profile : null;
      // Pantalla solo del médico tratante. El proxy ya lo revisa; esto cubre un rol que cambió
      // con la sesión abierta (P-140).
      if (profile && profile.rol !== USER_ROLES.doctor) {
        window.location.replace(HOME_ROUTE_BY_ROLE[profile.rol] ?? '/login');
        return;
      }
      if (wantsSearchRef.current) {
        wantsSearchRef.current = false;
        setIsPatientSearchOpen(true);
      }
      setSession(profile);
      if (profile) {
        setDoctor(toDoctorProfile(profile));
        void listPatients().then((result) => {
          if (isActive && result.ok) setPatients(result.patients);
        });
      }
    });
    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!isSidebarOpen && !isRecordOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setIsSidebarOpen(false);
      setIsRecordOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isSidebarOpen, isRecordOpen]);

  const openPatientSearch = () => {
    setIsSidebarOpen(false);
    setIsRecordOpen(false);
    setIsPatientSearchOpen(true);
    // Al abrir el buscador se actualiza la lista (el administrador pudo registrar pacientes).
    refreshPatients();
  };

  // En cuanto llega la lista, abre el paciente pedido en la URL (una sola vez).
  useEffect(() => {
    const requested = requestedPatientRef.current;
    if (!requested) return;
    const patient = patients.find((p) => p.id === requested);
    if (!patient) return;
    requestedPatientRef.current = null;
    startWithPatient(patient);
    // startWithPatient se define en cada render; solo importa reaccionar a la lista de pacientes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patients]);

  // Primera sección sin completar (o la última si ya están todas).
  const firstOpenSection = (completed: ReadonlySet<string>) =>
    buildSectionGroups(completed)
      .flatMap((group) => group.sections)
      .find((section) => section.status === 'in-progress')?.id ?? activeSectionId;

  // Sección a la que lleva "Guardar y continuar" (P-136): la primera sin completar; si ya están todas
  // completas (se está revisando o corrigiendo), la siguiente en orden. Antes se quedaba en la misma
  // y parecía que el botón no hacía nada.
  const nextSectionAfterSave = (completed: ReadonlySet<string>) => {
    const sections = buildSectionGroups(completed).flatMap((group) => group.sections);
    const open = sections.find((section) => section.status === 'in-progress');
    if (open && open.id !== activeSectionId) return open.id;
    const index = sections.findIndex((section) => section.id === activeSectionId);
    return sections[index + 1]?.id ?? activeSectionId;
  };

  // Huella de lo capturado (hallazgos con su valor), para saber si un guardado cambió algo.
  const recordFingerprint = (record: PatientRecord | null) =>
    record === null
      ? ''
      : JSON.stringify(record.hallazgos.map((h) => `${h.tipoHallazgo}|${h.descripcion}|${h.valor}`).sort());

  // Elegir o registrar un paciente: se lee su expediente y se retoma en la primera sección sin datos.
  const startWithPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setPatientRecord(null);
    setDiagnosis(null);
    setIsDiagnosisStale(false);
    setCompletedSections(new Set());
    setActiveSectionId(firstSectionId);
    void getRecord(patient.id).then((result) => {
      if (!result.ok) return;
      const done = sectionsWithData(result.data);
      setPatientRecord(result.data);
      setCompletedSections(done);
      setActiveSectionId(firstOpenSection(done));
    });
  };

  // Se guardó la sección actual: queda completada y se pasa a la siguiente sin completar (P-103).
  const handleSectionSaved = (record: PatientRecord) => {
    const done = new Set(completedSections).add(activeSectionId);
    // Si ya había un análisis y los hallazgos cambiaron, ya no corresponde a lo guardado. Guardar sin
    // cambios no lo desactualiza (P-136).
    if (diagnosis && recordFingerprint(record) !== recordFingerprint(patientRecord)) setIsDiagnosisStale(true);
    setPatientRecord(record);
    setCompletedSections(done);
    setActiveSectionId(nextSectionAfterSave(done));
  };

  // Diagnóstico confirmado: se anota en el paciente (y en la lista del buscador) para que el panel
  // del expediente ofrezca su resultado (P-111).
  const handleDiagnosisConfirmed = (diseaseName: string) => {
    if (!selectedPatient) return;
    const updated = { ...selectedPatient, diagnosis: diseaseName };
    setSelectedPatient(updated);
    setPatients((current) => current.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleAnalyzed = (result: DiagnosisResult) => {
    setDiagnosis(result);
    setIsDiagnosisStale(false);
    setCompletedSections((current) => new Set(current).add(activeSectionId));
  };

  // Hallazgos guardados, agrupados por tipo para el panel del expediente.
  const recordFindings = useMemo(() => {
    const groups: Partial<Record<FindingType, PatientFinding[]>> = {};
    for (const finding of patientRecord?.hallazgos ?? []) {
      (groups[finding.tipoHallazgo] ??= []).push({
        id: finding.idRegistro,
        description: finding.descripcion,
        value: finding.valor,
        unit: finding.unidades,
      });
    }
    return groups;
  }, [patientRecord]);

  const handleSelectSection = (id: string) => {
    setActiveSectionId(id);
    setIsSidebarOpen(false);
  };

  // Sección activa y su grupo, para el encabezado del chat.
  const orderedSections = sectionGroups.flatMap((group) =>
    group.sections.map((section) => ({ section, groupLabel: group.label })),
  );
  const activeIndex = Math.max(
    0,
    orderedSections.findIndex((entry) => entry.section.id === activeSectionId),
  );
  const active = orderedSections[activeIndex];

  // Bienvenida guiada (ESP-003): se muestra siempre que el médico escribe sin paciente (P-71).
  // Aceptar el aviso clínico se sigue registrando en la cuenta (USUARIOS.BienvenidaVista).
  const handleWelcomeAccepted = () => {
    void markWelcomeSeen().then((saved) => {
      if (!saved) console.warn('No se pudo registrar que se aceptó el aviso clínico de la bienvenida.');
    });
  };

  return (
    <div className="flex h-dvh flex-1 overflow-hidden bg-white text-base text-slate-900">
      <Sidebar
        groups={sectionGroups}
        activeSectionId={activeSectionId}
        onSelectSection={handleSelectSection}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onSearchPatient={openPatientSearch}
        selectedPatientName={selectedPatient?.fullName ?? null}
      />

      <PatientSearchDialog
        open={isPatientSearchOpen}
        patients={patients}
        onClose={() => setIsPatientSearchOpen(false)}
        onSelect={(patient) => {
          setIsPatientSearchOpen(false);
          startWithPatient(patient);
        }}
      />

      {isSidebarOpen && (
        <div
          aria-hidden="true"
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/30 lg:hidden"
        />
      )}

      {/* Alto exacto de la ventana: el chat y el expediente hacen scroll por dentro. */}
      <div className="flex h-dvh min-w-0 flex-1 flex-col">
        <TopNavbar
          doctor={doctor}
          isSidebarOpen={isSidebarOpen}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          isRecordOpen={isRecordOpen}
          onOpenRecord={() => setIsRecordOpen(true)}
          isCollapsed={isTopbarCollapsed}
          onToggleCollapsed={() => setIsTopbarCollapsed((collapsed) => !collapsed)}
        />

        <div className="flex min-h-0 flex-1">
          <main className="min-h-0 min-w-0 flex-1">
            <AssistantChat
              key={`${active.section.id}-${selectedPatient?.id ?? 'none'}-${session === undefined ? 'loading' : 'ready'}`}
              groupLabel={active.groupLabel}
              section={active.section}
              position={activeIndex + 1}
              total={orderedSections.length}
              isHeaderCollapsed={isChatHeaderCollapsed}
              onToggleHeader={() => setIsChatHeaderCollapsed((collapsed) => !collapsed)}
              patient={selectedPatient}
              doctorName={session?.nombreCompleto ?? doctor.displayName}
              onWelcomeAccepted={handleWelcomeAccepted}
              onSearchPatient={openPatientSearch}
              record={patientRecord}
              onSectionSaved={handleSectionSaved}
              diagnosis={diagnosis}
              isDiagnosisStale={isDiagnosisStale}
              onAnalyzed={handleAnalyzed}
              onDiagnosisConfirmed={handleDiagnosisConfirmed}
            />
          </main>

          {/* Pantallas grandes: columna fija a la derecha, debajo de la barra superior. */}
          <aside
            aria-label="Expediente del paciente"
            className={`hidden shrink-0 overflow-hidden border-l-2 border-slate-200 transition-[width] duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none xl:block ${
              isRecordCollapsed ? 'w-16' : 'w-80'
            }`}
          >
            <PatientRecordPanel
              patient={selectedPatient}
              sectionGroups={sectionGroups}
              findings={recordFindings}
              diagnosis={diagnosis}
              isDiagnosisStale={isDiagnosisStale}
              collapsed={isRecordCollapsed}
              onToggleCollapsed={() => setIsRecordCollapsed((collapsed) => !collapsed)}
            />
          </aside>
        </div>
      </div>

      {/* Pantallas medianas y móvil: el mismo panel como cajón desde la derecha. */}
      {isRecordOpen && (
        <>
          <div
            aria-hidden="true"
            onClick={() => setIsRecordOpen(false)}
            className="fixed inset-0 z-30 bg-slate-950/30 xl:hidden"
          />
          <aside
            id="patient-record-drawer"
            aria-label="Expediente del paciente"
            className="fixed inset-y-0 right-0 z-40 w-[min(22rem,100vw)] overflow-hidden border-l-2 border-slate-200 xl:hidden"
          >
            <PatientRecordPanel
              patient={selectedPatient}
              sectionGroups={sectionGroups}
              findings={recordFindings}
              diagnosis={diagnosis}
              isDiagnosisStale={isDiagnosisStale}
              onClose={() => setIsRecordOpen(false)}
            />
          </aside>
        </>
      )}
    </div>
  );
}
