# 11. Especificación: validación del diagnóstico por el médico internista

| Campo | Valor |
|---|---|
| Identificador | ESP-008 |
| Origen | Decisión final del equipo, comunicada por Lucía (P-151): el médico internista recibe los diagnósticos diferenciales de la máquina de inferencia, los confirma y la confirmación le llega al médico tratante. Reemplaza el aviso simulado de `36a01ff` (Castañeda). |
| Estado | Implementada y verificada por HTTP. Falta la revisión visual de Lucía. |
| Tareas | [tareas/validacion-internista.md](../tareas/validacion-internista.md), T72 a T79 |
| Casos de prueba | Sección 6 de este documento: PT60, PT61 y PT101 a PT109 |

## 1. Reparto de tareas por rol

| Rol | Qué hace |
|---|---|
| Administrador (`A`) | Registra y elimina pacientes. Registra y elimina médicos tratantes e internistas. |
| Médico tratante (`T`) | Busca pacientes, llena el interrogatorio y las secciones, analiza y **envía** el diagnóstico diferencial al internista. No registra pacientes ni confirma diagnósticos. |
| Médico internista (`I`) | **Recibe** los diagnósticos diferenciales, revisa los hallazgos y **confirma** uno de los candidatos. |

## 2. Flujo

```
Tratante: captura → Analizar → Enviar al médico internista     (estado P: "Enviado a validación")
Internista: Pendientes → revisa hallazgos y candidatos → Confirmar   (estado C)
Tratante: "{enfermedad}: confirmado por el médico internista {nombre}" → interfaz de salida
```

- Los candidatos los da la máquina de inferencia registrada (`IInferenceEngine`, hoy la provisional). Cuando llegue la del equipo, este flujo no cambia.
- El internista ve siempre el análisis calculado con los hallazgos actuales. Si el tratante corrige hallazgos mientras está pendiente, el internista ya ve la versión corregida.
- Después de confirmado, el tratante puede **enviarlo de nuevo** (por ejemplo, si corrigió hallazgos). Vuelve a pendiente y el diagnóstico anterior se conserva hasta la nueva confirmación.
- Un diagnóstico guardado sin pasar por el internista (como los del seed) **no** cuenta como confirmado: queda "sin enviar" y se muestra como "registrado, sin validar por el médico internista" (A-28).

## 3. Requisitos funcionales

| ID | Requisito |
|---|---|
| RF-53 | Con un análisis al día y con candidatos, el tratante ve "Enviar al médico internista". Al enviarlo, el paciente queda pendiente (`P`) con el tratante y la fecha. Sin candidatos responde 409. |
| RF-54 | Mientras está pendiente, el tratante ve "Enviado a validación del médico internista. En espera de su confirmación" y no puede reenviar. |
| RF-55 | El internista, en `/internista`, ve la lista de **Pendientes** por orden de llegada y la de **Confirmados** (las 50 más recientes). |
| RF-56 | Al abrir un paciente, el internista ve sus datos, quién lo envió y cuándo, los hallazgos por tipo y el diagnóstico diferencial con "Confirmar este diagnóstico" en cada candidato. |
| RF-57 | Solo se confirma un candidato del análisis actual (si no, 400) y solo si el tratante ya lo envió (si no, 409). Si cambió la enfermedad, el tratamiento anterior se quita; si es la misma, se conserva. |
| RF-60 | Desde **Confirmados**, el internista puede corregir un diagnóstico ya confirmado (por ejemplo, un error de dedo) con "Cambiar a este diagnóstico" en otro candidato. Se guardan el internista y la fecha de la corrección, y al tratante le llega el diagnóstico corregido (P-153). |
| RF-58 | Ya confirmado, el tratante ve "{enfermedad}: confirmado por el médico internista {nombre}" en el diagnóstico diferencial, en el panel del expediente y en la interfaz de salida. |
| RF-59 | Permisos: solo `T` envía; solo `I` lista, abre y confirma; `T` e `I` consultan el estado. Tratamiento y plan los guarda solo `T`. La ruta anterior `PUT /api/patients/{id}/diagnosis` se eliminó. |

## 4. Datos

`AddDiagnosisValidation.sql` agrega a `PACIENTES` (y `CreateClinicalTables.sql` las crea en bases nuevas):

| Columna | Tipo | Uso |
|---|---|---|
| `EstadoValidacion` | `CHAR(1)` NULL | `P` pendiente, `C` confirmado, NULL sin enviar (`CK_PACIENTES_ESTADO_VALIDACION`). |
| `Id_MedicoSolicitante` | `INT` NULL | Tratante que lo envió. |
| `FechaSolicitud` | `DATETIME2(0)` NULL | Cuándo lo envió (UTC). |
| `Id_MedicoValidador` | `INT` NULL | Internista que lo confirmó. |
| `FechaValidacion` | `DATETIME2(0)` NULL | Cuándo lo confirmó (UTC). |

Las columnas de médicos no llevan llave foránea: si el administrador elimina a un médico, el historial del paciente se conserva y el nombre aparece vacío.

## 5. Capas

- **Backend:**
  - Controlador: `DiagnosisValidationController`. El ID del médico se toma del token, nunca del cuerpo.
    - `GET /api/patients/{id}/validation` (T, I) y `POST` (T).
    - `GET /api/validations?estado=P|C` (I).
    - `GET` y `PUT /api/validations/{id}` (I).
  - Servicio: `IDiagnosisValidationService` / `DiagnosisValidationService`. Usa `IDiagnosisService` para el análisis (D de SOLID) y `TimeProvider` para la fecha.
  - Repositorio: `IDiagnosisValidationRepository` / `DiagnosisValidationRepository`.
  - Estados: `Configuration/ValidationStates`. Modelos: `ValidationSummary` y `ValidationDetail`.
  - `PatientSummary` agrega `EstadoValidacion` y `ValidadoPor`.
  - Se quitó `ConfirmarDiagnosticoAsync` de `PatientResultService`.
- **Frontend:**
  - Internista: `components/internist/InternistScreen.tsx` (lista) y `ValidationDetail.tsx` (caso).
  - Tratante: `components/capture/DiagnosisPanel.tsx` (enviar y avisos), `PatientRecordPanel.tsx` y `ResultSections.tsx`.
  - Servicio: `services/validationService.ts`. Tipos: `types/validation.ts`.
  - Rutas: `app/api/patients/[id]/validation`, `app/api/validations` y `app/api/validations/[id]`.

## 6. Casos de prueba

### PT101. Enviar a validación [auto, xUnit]

- **Given** un paciente sin enviar cuyo análisis tiene candidatos.
- **When** el tratante lo envía.
- **Then** queda pendiente con el tratante y la fecha, sin milisegundos.

### PT102. Enviar sin candidatos o paciente inexistente [auto, xUnit]

- **Given** un análisis sin candidatos, o un paciente que no existe.
- **When** el tratante intenta enviarlo.
- **Then** responde `SinCandidatos` o `PacienteNoExiste` y no guarda nada.

### PT103. Confirmar [auto, xUnit]

- **Given** un paciente pendiente con asma diagnosticada antes y su tratamiento.
- **When** el internista confirma asma.
- **Then** queda confirmado, con el internista y la fecha, y el tratamiento se conserva.

### PT60. Confirmar otra enfermedad quita el tratamiento [auto, xUnit]

Pasó de `PatientResultServiceTests` a `DiagnosisValidationServiceTests`.

- **Given** un paciente pendiente con asma y su tratamiento.
- **When** el internista confirma otra enfermedad candidata.
- **Then** se guarda el diagnóstico nuevo y el tratamiento se quita.

### PT61. Enfermedad no candidata [auto, xUnit]

Antes: "enfermedad inexistente". Ahora solo se acepta un candidato del análisis.

- **Given** un paciente pendiente.
- **When** el internista confirma una enfermedad que no propuso el análisis.
- **Then** se rechaza y sigue pendiente.

### PT104. Confirmar sin enviar [auto, xUnit]

- **Given** un paciente que el tratante no ha enviado, aunque tenga un diagnóstico del seed.
- **When** el internista intenta confirmar.
- **Then** responde `NoEnviado` y no cambia nada.

### PT109. Corregir un diagnóstico confirmado [auto, xUnit]

Agregado en P-153.

- **Given** un paciente confirmado con asma por error, con su tratamiento elegido.
- **When** un internista lo cambia a otra enfermedad candidata.
- **Then** queda el diagnóstico corregido, con quién y cuándo lo corrigió, y el tratamiento anterior se quita.

### PT105. Reenviar después de confirmado [auto, xUnit]

- **Given** un paciente confirmado.
- **When** el tratante lo envía de nuevo.
- **Then** vuelve a pendiente, sin validador, y el diagnóstico anterior se conserva.

### PT106. Estado efectivo [auto, xUnit]

Corregido en A-28.

- **Given** un paciente con diagnóstico guardado sin pasar por el internista (estado NULL).
- **When** se calcula su estado.
- **Then** sigue "sin enviar": solo `P` o `C` guardados cuentan, y un valor desconocido se ignora.

### PT107. Flujo completo y permisos por HTTP [manual, verificado por la IA]

- **Given** la API y el frontend levantados, con las cuentas 123456 (`T`), 654322 (`I`) y 654321 (`A`).
- **When** se recorre el flujo con `PACIE00001`: el tratante envía, el internista confirma y el tratante consulta.
- **Then** pasan las 19 comprobaciones: estados `P` y `C`, nombre del internista en la lista y en la salida, 400 con enfermedad no candidata, 409 al confirmar dos veces, 403 para el tratante al confirmar y listar, para el internista al enviar y guardar el plan, y para el administrador al listar; la ruta vieja responde 404. Al terminar, el paciente se restauró.

### PT108. Pantallas [manual, pendiente]

- **PT108a.** El tratante analiza, envía y ve "Enviado a validación del médico internista".
- **PT108b.** El internista ve al paciente en Pendientes, revisa hallazgos y candidatos, y confirma.
- **PT108c.** El tratante, al volver al diagnóstico diferencial, ve "confirmado por el médico internista {nombre}", y el panel del expediente ofrece el resultado.
