# Tareas: inicio de sesión

Especificación: [ESP-001](../especificaciones/03-inicio-sesion.md) · Plan: [02-plan-inicio-sesion.md](../planes/02-plan-inicio-sesion.md)

Cada tarea indica el requisito o la decisión que cumple, la prueba que la verifica y si la hizo una persona o un asistente de IA. La columna **Revisión humana** remite a [auditoria-humana.md](../auditoria/auditoria-humana.md). Una tarea hecha con IA solo cuenta como terminada cuando una persona del equipo la revisó.

Leyenda: `[x]` implementada · `[ ]` pendiente.

## Backend

| # | Tarea | Cumple | Prueba | Hecha por | Revisión humana |
|---|---|---|---|---|---|
| [x] T01 | Endpoint `POST /api/auth/login` con BCrypt y JWT (versión inicial). | RF-01, RF-03, RF-04 | PT01, PT02 | Equipo | — |
| [x] T02 | Migración de contraseñas en texto plano a BCrypt y script `UpgradeUserPasswordColumn.sql`. | RF-05 | PT06 | Equipo | — |
| [x] T03 | Interfaces `IUserRepository`, `IPasswordCredentialVerifier`, `ITokenService` e `IDatabaseHealthService`. | D-01, D-02 | `AuthServiceTests` | IA (P-04) | Pendiente |
| [x] T04 | `UserRepository` sobre EF Core. | D-02 | PT01 | IA (P-04) | Pendiente |
| [x] T05 | `AuthService` como fachada, con precondiciones verificadas. | D-01, D-04 | `AuthServiceTests` | IA (P-04) | A-04 (corregido) |
| [x] T06 | `PasswordCredentialVerifier` sin efectos ocultos y con verificación ficticia. | D-03, D-04 | `PasswordCredentialVerifierTests` | IA (P-04) | Pendiente |
| [x] T07 | `JwtOptions` validadas al arrancar; emisor, audiencia y expiración en la configuración. | D-05, RNF-03 | PT08, `JwtTokenServiceTests` | IA (P-04) | Pendiente |
| [x] T08 | Validación del modelo con respuesta 400 `{ error }`. | RF-02 | PT04, PT05 | IA (P-04) | Pendiente |
| [x] T09 | `GlobalExceptionHandler` (503 / 500). | D-06, CA-05 | PT07 | IA (P-04) | Pendiente |
| [x] T10 | Validación de JWT (`AddJwtBearer`) y CORS desde la configuración. | RNF-03 | — | IA (P-04) | Pendiente |
| [x] T11 | Agregar el proyecto de pruebas a la solución y marcar `PT02` como prueba de integración. | R-PRU-02 | `dotnet test` | IA (P-04) | Pendiente |

## Frontend

| # | Tarea | Cumple | Prueba | Hecha por | Revisión humana |
|---|---|---|---|---|---|
| [x] T12 | Pantalla de inicio de sesión con selector de cuenta y animación (versión inicial). | RF-06 | PT14 | Equipo | — |
| [x] T13 | Modelo `types/auth.ts` y validación `lib/loginValidation.ts`. | RF-07 | PT09, PT10 | IA (P-04) | Pendiente |
| [x] T14 | Patrón Estado en `lib/loginState.ts`. | RF-08, D-08 | PT11, PT16 | IA (P-04) | Pendiente |
| [x] T15 | Extraer `LoginForm.tsx` conservando el diseño; agregar etiquetas y atributos ARIA. | D-10, RNF-05 | PT14 | IA (P-04) | Pendiente |
| [x] T16 | `services/authService.ts` y `lib/apiClient.ts`. | ARQ | PT12, PT15 | IA (P-04) | Pendiente |
| [x] T17 | Ruta `/api/login` con validación y cookie `httpOnly`; "Recuérdame" funcional. | RNF-01, RF-09, D-07 | PT13 | IA (P-04) | Pendiente |
| [x] T18 | Singleton del pool en `lib/db.ts`; `/api/test-db` solo en desarrollo. | D-09 | — | IA (P-04) | Pendiente |
| [x] T19 | Corregir las advertencias de ESLint `set-state-in-effect` en `page.tsx` y `LoginForm.tsx`. | Calidad | `npm run lint` | IA (P-04) | Pendiente |

## Documentación y proceso

| # | Tarea | Cumple | Prueba | Hecha por | Revisión humana |
|---|---|---|---|---|---|
| [x] T20 | Casos Given-When-Then PT01–PT16. | R-PRU-01 | — | IA (P-04) | A-03 (corregido) |
| [x] T21 | Documento de arquitectura, SOLID y patrones. | R-ARQ-06 | — | IA (P-04) | Pendiente |
| [x] T22 | Carpeta `specs/` con reglas, especificación, plan, tareas, bitácora y auditoría. | R-IA-01, R-IA-02 | — | IA (P-07) | Pendiente |
| [ ] T23 | Ejecutar manualmente PT01–PT16 y registrar los resultados. | R-PRU-01 | PT01–PT16 | Equipo | — |
| [ ] T24 | Revisar y firmar en la auditoría las tareas T03–T22. | R-IA-02 | — | Equipo | — |

## Pendientes fuera de esta especificación

| # | Tarea | Motivo |
|---|---|---|
| [ ] T25 | Definir el destino de "Términos y privacidad" y de "Recuperar contraseña", y convertirlos en controles accesibles con teclado. | Hoy son `<span>` sin acción (R-UI-03). |
| [ ] T26 | Guardar `ai-service/requirements.txt` en UTF-8. | Está en UTF-16 y `pip install -r` puede fallar. |
| [ ] T27 | Hacer el primer commit y crear las ramas `main` y `Develop`. | El repositorio local todavía no tiene commits. |
| [x] T28 | Transición simulada tras el login: capa con desenfoque y animación loading-dots, y redirección a `/home` (pantalla de prueba). Falta proteger `/home` y quitar la espera fija. | IA (P-08), revisión pendiente. |
| [x] T29 | Renombrar carpetas y archivos de código al inglés (R-ARQ-07); la ruta principal pasa a `/home`. | IA (P-09), revisión pendiente. |
| [x] T30 | Barra lateral visual de la pantalla principal: buscar paciente, secciones del expediente con estado y botón para guardar. Sin lógica todavía. | IA (P-10), revisión pendiente. |
| [x] T31 | Barra superior: saludo según la hora con `{nombre}`, fecha, notificaciones, ayuda y menú de cuenta. Sin lógica todavía. | IA (P-13), corregido (A-06). |
| [x] T32 | Buscador de pacientes en ventana modal: búsqueda por nombre o expediente y filtros de edad y diagnóstico (P-40; antes sexo y última consulta). Sin datos todavía (se quitaron los de ejemplo en P-33); falta conectarlo a la API. | IA (P-31), revisión pendiente. |
| [x] T33 | Tablas clínicas en SQL Server y carga de los CSV del equipo de base de datos (`CreateClinicalTables.sql`, `SeedClinicalData.sql` generado). Falta ejecutarlo en la base real y resolver con el equipo los 4 textos con `?` y las 3 enfermedades endémicas sin registrar. | IA (P-34), revisión pendiente. |
| [x] T34 | Volver a crear `dbo.USUARIOS` en el nuevo esquema (`CreateUsersTable.sql`, reemplazado en P-38 por `CreateDoctorsAndUsersTables.sql`) y recuperar sus 2 usuarios del respaldo (P-37). Falta probar el login con la API. Respaldo del esquema anterior: `XpertDiagnostic_antes_de_tablas_clinicas_2026-11-16.bak`. | Decisión de Lucía (P-36). |
| [x] T35 | Tabla `MEDICOS` sencilla (`CreateDoctorsAndUsersTables.sql`) enlazada a `USUARIOS`; el médico 1 se pasó desde el respaldo y el 123456 (ficticio) se registró con cédula 0000000 (P-39); llave foránea agregada. | IA (P-38), ESP-002. |
| [x] T36 | API: `GET /api/doctors/me` y `POST /api/doctors` (solo rol `A`) con `DoctorService`, `DoctorRepository` e `IPasswordHasher`; pruebas PT17 a PT22. | IA (P-38), ESP-002. |
| [x] T37 | Frontend: rutas `/api/session` y `/api/doctors`, barra superior con el nombre real y opción "Registrar médico" solo para administradores. | IA (P-38), ESP-002. |
| [x] T38 | Pantalla `/doctors/new` para registrar médicos con su cuenta. | IA (P-38), ESP-002. |
| [ ] T39 | Ejecutar a mano PT23 a PT28 con la API y el frontend en marcha. | Requiere un administrador real. |
| [x] T40 | Panel derecho "Expediente" (solo visual): ficha del paciente, avance de la captura, hallazgos por tipo y diagnóstico y plan. Columna fija en `xl`, cajón en pantallas menores. Falta conectarlo a `HALLAZGOS_PACIENTE` y `PLANES`. | IA (P-42), revisión pendiente. |
| [x] T41 | Chat del asistente en el centro (solo visual): encabezado de la sección, mensajes con `logoxd.png` como avatar, respuestas rápidas, caja de texto y aviso para médicos; encabezado contraíble (P-52). Falta conectarlo al servicio de IA. | IA (P-44), revisión pendiente. |
| [x] T42 | Captura sección por sección: la primera empieza "En proceso", las pendientes se bloquean con candado en el sidebar y el avance a la siguiente sección lo disparará el chat de IA (el botón "Siguiente" se quitó en P-51). | IA (P-45), revisión pendiente. |
| [x] T43 | Columna `USUARIOS.BienvenidaVista` (en `CreateDoctorsAndUsersTables.sql`, aplicada en la base real) y endpoint `POST /api/doctors/me/welcome`; `GET /api/doctors/me` la incluye. Pruebas PT29 a PT31. | IA (P-59), ESP-003. |
| [x] T44 | Chat sin mensajes de ejemplo; bienvenida guiada de 4 pasos (Continuar, Entendido, Acepto, Buscar paciente) solo si la cuenta no la ha visto. | IA (P-59), ESP-003. |
| [ ] T45 | Ejecutar a mano PT32 a PT34 con la API y el frontend en marcha. | Requiere iniciar sesión con una cuenta real. |
| [x] T46 | La bienvenida arranca con el primer mensaje del médico; portada decorativa en el chat vacío. | IA (P-65), ESP-003. |
| [x] T47 | Barra superior plegable (persiana con lengüeta) y expediente plegable (lomo con avance vertical e íconos de hallazgos). | IA (P-75). |
| [x] T48 | Modelo del alta de paciente: `validateNewPatient`, `nextPatientId` y `createPatient` (`lib/newPatient.ts`), con PT35 a PT39 verificadas. | IA (P-99, P-100), ESP-004. |
| [x] T49 | Ventana "Nuevo paciente" y entradas desde la barra lateral, el buscador y el último paso del recorrido. | IA (P-99), ESP-004. |
| [x] T50 | Guardar el paciente en `PACIENTES` y listar desde la base: `GET`/`POST /api/patients`, `PatientService` con PT42 a PT45 y `patientService` del frontend. | IA (P-102), ESP-004. |
| [x] T51 | Catálogos de solo lectura: `GET /api/catalogs/{nombre}` (síntomas, signos, estudios de laboratorio, comorbilidades, enfermedades), con PT46 y PT48. | IA (P-102). |
| [x] T52 | Captura estructurada por sección: elegir del catálogo, guardar en `HALLAZGOS_PACIENTE` (o la enfermedad preexistente en `PACIENTES`) y llenar "Hallazgos registrados". PT49 a PT54 y PT56. | IA (P-103), ESP-005. |
| [x] T53 | Avance real entre secciones: guardar completa la sección y desbloquea la siguiente; retomar marca las que ya tienen datos. | IA (P-103), ESP-005. |
| [x] T54 | "Analizar": `IInferenceEngine` con implementación provisional (inversión de dependencias). PT55 y PT57. | IA (P-103), ESP-005. |
| [ ] T55 | Ejecutar a mano PT58 (flujo completo con sesión). | Requiere iniciar sesión. |
| [x] T56 | Confirmar el diagnóstico y guardar las salidas en `PACIENTES` y `PLANES`: el médico elige el tratamiento y escribe el plan. PT59 a PT65. | IA (P-105), ESP-006. Decisiones de Lucía. |
| [x] T58 | Interfaz de salida `/patients/{id}/result` según el boceto: historia clínica, diagnóstico, tratamiento, plan, Descargar PDF e Imprimir, con sus enlaces desde el análisis y el buscador. | IA (P-105), ESP-006. |
| [ ] T59 | Ejecutar a mano PT68 a PT71 con sesión, con la API reiniciada. | Requiere reiniciar la API de Lucía. |
| [ ] T57 | Reemplazar `ProvisionalInferenceEngine` por la máquina de inferencia del equipo y evaluarla con PT57. | Equipo de inferencia. |
