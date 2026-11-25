# 09. Especificación: interfaz de salida del expediente

| Campo | Valor |
|---|---|
| Identificador | ESP-006 |
| Origen | Petición de Lucía (P-105), con su boceto: desarrollar la interfaz de salida y conectarla con la de entrada, de forma lógica y coherente con lo que dijo Axel. |
| Estado | Implementada; **de solo lectura desde P-164**. Falta probarla con sesión contra la API reiniciada (PT71). |
| Tareas | [tareas/interfaz-de-salida.md](../tareas/interfaz-de-salida.md), T56, T58, T59 y T88 a T90 |
| Casos de prueba | Sección 6 de este documento, PT64 a PT71, PT122 y PT123 |

## 1. Objetivo

Mostrar las **salidas** del paciente: enfermedad diagnosticada, tratamiento y plan. Se llega desde la **entrada**, que es la captura de ESP-005, en este orden:

```
Entrada (captura) → Analizar → Enviar al internista → El internista confirma → Salida
```

**Desde P-164 la salida no se edita.** Todo sale ya calculado por la máquina de inferencia (ESP-010) para el diagnóstico que confirmó el médico internista (ESP-008). Mientras no hay confirmación, el diagnóstico, el tratamiento y el plan dicen que estarán disponibles cuando el internista confirme.

## 2. Decisiones de Lucía

| Tema | Decisión |
|---|---|
| Edición | **P-164:** "todo esto debe salir como ya calculado por la máquina, no debe ser editable". Se quitaron los botones "Guardar tratamiento" y "Guardar plan" y los endpoints `PUT treatment` y `PUT plan`. |
| Tratamiento: cada enfermedad tiene de 7 a 20 en `TRATAMIENTOS` | **P-164:** el tratamiento indicado es el **primero** de la enfermedad confirmada (menor ID), como lo devuelve `inference_engine.prg`. Debajo se listan los demás de la base de conocimiento, sin poder elegirlos. (En P-105 el médico lo elegía.) |
| Plan: la base de conocimiento no trae planes, y `PLANES` tiene uno por paciente de prueba | **P-164:** el plan indicado se arma con los tratamientos de la enfermedad (uno por línea, con dosis). La expectativa y el seguimiento se muestran del plan guardado del paciente, si tiene; si no, "Sin registro". (En P-105 lo escribía el médico.) |
| Sin confirmación | **P-164:** no se muestra diagnóstico, tratamiento ni plan, aunque el paciente tenga un diagnóstico cargado de antemano (pacientes de prueba) o uno anterior que se reenvió a validación. |
| "Compartir" del boceto | Se quita por ahora. Quedan **Descargar PDF** e **Imprimir**. |
| "Masculino" del boceto | No se muestra: `PACIENTES` no tiene sexo (A-11). |

## 3. Pantalla (`/patients/{id}/result`)

| Zona | Contenido |
|---|---|
| Izquierda | Buscar paciente, Volver a la captura, Descargar PDF e Imprimir. |
| Centro | Encabezado del paciente (nombre, edad y expediente) y cuatro tarjetas con el ícono de XpertDiagnostic: **1. Historia clínica**, **2. Diagnóstico**, **3. Tratamiento**, **4. Plan, expectativa y seguimiento**. |
| Derecha | "Expediente de {nombre}", con el estado de cada parte (completo o pendiente). |
| Impresión / PDF | Solo el centro, sin enlaces ni columnas laterales. |

## 4. Requisitos funcionales

| ID | Requisito |
|---|---|
| RF-44 | ~~Cada candidato del análisis tiene "Confirmar este diagnóstico"~~. **Reemplazado por ESP-008 (P-151):** el tratante envía el diagnóstico diferencial y el médico internista confirma el candidato, que se guarda en `IdEnfermedadDiagnosticada`. Ver [11-validacion-internista.md](11-validacion-internista.md). |
| RF-45 | Si el internista confirma otra enfermedad, el tratamiento anterior se quita, porque ya no le corresponde. Si es la misma, se conserva. |
| RF-46 | La tarjeta "Historia clínica" muestra todas las entradas: enfermedad preexistente y hallazgos por tipo, con valor y unidades. |
| RF-47 | ~~El médico elige el tratamiento y lo guarda.~~ **P-164:** la tarjeta "Tratamiento" muestra como "Tratamiento indicado" el primero de la enfermedad confirmada, con su dosis, y debajo los demás. Es de solo lectura. |
| RF-48 | ~~El médico escribe y guarda el plan.~~ **P-164:** la tarjeta "Plan" muestra el plan indicado (los tratamientos de la enfermedad, uno por línea) y la expectativa y el seguimiento guardados, o "Sin registro". Es de solo lectura. |
| RF-68 | (P-164) Sin confirmación del médico internista, el resultado no trae diagnóstico, tratamientos ni plan. El diagnóstico dice si está en validación o sin enviar; con confirmación dice "Calculado por la máquina de inferencia y confirmado por el médico internista {nombre} el {fecha}". |
| RF-49 | "Descargar PDF" abre la impresión del navegador con el título "Expediente {ID} - {nombre}", que sirve de nombre sugerido del archivo; "Imprimir" abre la misma ventana. |
| RF-50 | En el buscador, los pacientes con diagnóstico tienen "Ver resultado". "Volver a la captura" abre `/home?paciente={ID}`, que retoma a ese paciente, y "Buscar paciente" abre `/home?buscar=1`. |

## 5. Capas

- **Backend:** `PatientResultController` → `IPatientResultService` / `PatientResultService` → `IPatientResultRepository` / `PatientResultRepository`.
  - Entidades: `Treatment` (`TRATAMIENTOS`) y `CarePlan` (`PLANES`).
  - DTO: `ConfirmDiagnosisRequest` (lo usa la validación). `ChooseTreatmentRequest` y `SaveCarePlanRequest` se quitaron en P-164.
  - Resultado: `PatientResult`, con `FechaValidacion` desde P-164.
- **Frontend:**
  - Página: `app/(app)/patients/[id]/result/page.tsx`. Lee el ID dentro de `<Suspense>`, como pide Next 16 con `cacheComponents`.
  - Vista: `components/result/PatientResultScreen.tsx` y `ResultSections.tsx`.
  - Servicio: `services/resultService.ts`.
  - Ruta: `app/api/patients/[id]/result`. Las rutas `treatment` y `plan` se quitaron en P-164.
  - Tipos: `types/result.ts`.

## 6. Casos de prueba

### PT59, PT62 y PT63. Siguiente IdPlan, elegir tratamiento y guardar el plan

Retiradas en P-164: la salida ya no se edita.

### PT60 y PT61. Confirmar el diagnóstico

Pasaron a [11-validacion-internista.md](11-validacion-internista.md) (P-151): ahora confirma el médico internista y solo se acepta un candidato del análisis.

### PT64. Sin confirmación del internista [auto, xUnit] (reescrita en P-164)

- **Given** un diagnóstico, tratamiento y plan guardados, con la validación sin enviar o pendiente.
- **When** se consulta el resultado.
- **Then** trae la historia clínica, pero ni diagnóstico, ni tratamientos, ni plan.

### PT122. Salidas de la base de conocimiento [auto, xUnit]

- **Given** el asma confirmada por el internista, con otro tratamiento guardado y un plan con pronóstico y seguimiento.
- **When** se consulta el resultado.
- **Then** el tratamiento indicado es el primero del asma; el plan indicado lista sus tratamientos con dosis; se conservan pronóstico, seguimiento y fecha de confirmación.

### PT123. Confirmado sin plan guardado [auto, xUnit]

- **Given** una enfermedad confirmada y ningún plan guardado.
- **When** se consulta el resultado.
- **Then** hay plan indicado, sin pronóstico ni seguimiento.

### PT65. Resultado real [auto, integración, solo lectura]

- **Given** el paciente de prueba `PACIE00001`.
- **When** se consulta su resultado en la base real.
- **Then** trae el diagnóstico, los tratamientos de esa enfermedad (con el indicado entre ellos) y su plan.

### PT66. HTTP del resultado [manual, verificado por la IA]

- **Given** la API con los endpoints de la salida y una sesión de prueba.
- **When** se consulta `PACIE00001`, se elige un tratamiento de otra enfermedad y se confirma una enfermedad inexistente.
- **Then** el resultado trae 13 tratamientos, el indicado y el plan, y las dos operaciones inválidas responden 400.

### PT67. Pantalla e impresión [manual, verificado por la IA]

- **Given** la pantalla de salida de `PACIE00001`.
- **When** se muestra en pantalla y en modo impresión.
- **Then** aparecen las cuatro tarjetas y "Expediente de" en pantalla; en impresión solo queda el centro.

### PT68 a PT71. Flujo con sesión [manual]

- **PT68.** ~~Confirmar un candidato abre la salida con ese diagnóstico.~~ Ahora lo cubre PT108 (ESP-008).
- **PT69 y PT70.** ~~Guardar tratamiento y plan.~~ Retiradas en P-164.
- **PT71.** "Volver a la captura" retoma al mismo paciente.
