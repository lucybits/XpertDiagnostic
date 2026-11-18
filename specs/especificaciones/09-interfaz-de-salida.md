# 09. Especificación: interfaz de salida del expediente

| Campo | Valor |
|---|---|
| Identificador | ESP-006 |
| Origen | Petición de Lucía (P-105), con su boceto: desarrollar la interfaz de salida y conectarla con la de entrada, de forma lógica y coherente con lo que dijo Axel. |
| Estado | Implementada. Falta probarla con sesión contra la API reiniciada (PT71). |
| Tareas | [tareas/inicio-sesion.md](../tareas/inicio-sesion.md), T56 y T58 |
| Casos de prueba | Sección 6 de este documento, PT59 a PT71 |

## 1. Objetivo

Mostrar y completar las **salidas** de `PACIENTES`: enfermedad diagnosticada, tratamiento y plan. Se llega desde la **entrada**, que es la captura de ESP-005, en este orden:

```
Entrada (captura) → Analizar → Confirmar diagnóstico → Salida
```

## 2. Decisiones de Lucía (P-105)

| Tema | Decisión |
|---|---|
| Tratamiento: cada enfermedad tiene de 7 a 20 en `TRATAMIENTOS`, pero `PACIENTES.IdTratamiento` guarda uno | **El médico elige** el indicado entre los de la enfermedad confirmada. |
| Plan: `PLANES` no está ligado a enfermedades (hay uno por paciente de prueba) | **Lo escribe el médico**: plan indicado, pronóstico (expectativa) y seguimiento. |
| "Compartir" del boceto | Se quita por ahora. Quedan **Descargar PDF** e **Imprimir**. |
| "Masculino" del boceto | No se muestra: `PACIENTES` no tiene sexo (A-11). |

## 3. Pantalla (`/patients/{id}/result`)

| Zona | Contenido |
|---|---|
| Izquierda | Buscar paciente, Volver a la captura, Descargar PDF e Imprimir. |
| Centro | Encabezado del paciente (nombre, edad y expediente) y cuatro tarjetas con el ícono de XpertDiagnostic: **1. Historia clínica**, **2. Diagnóstico**, **3. Tratamiento**, **4. Plan, expectativa y seguimiento**. |
| Derecha | "Expediente de {nombre}", con el estado de cada parte (completo o pendiente). |
| Impresión / PDF | Solo el centro. El tratamiento muestra solo el indicado y el plan, su texto; sin botones ni columnas laterales. |

## 4. Requisitos funcionales

| ID | Requisito |
|---|---|
| RF-44 | Cada candidato del análisis tiene "Confirmar este diagnóstico". Al pulsarlo se guarda `IdEnfermedadDiagnosticada` y se abre la interfaz de salida. |
| RF-45 | Si se confirma otra enfermedad, el tratamiento anterior se quita, porque ya no le corresponde. Si es la misma, se conserva. |
| RF-46 | La tarjeta "Historia clínica" muestra todas las entradas: enfermedad preexistente y hallazgos por tipo, con valor y unidades. |
| RF-47 | La tarjeta "Tratamiento" lista los tratamientos de la enfermedad confirmada, con su dosis y unidades. El médico elige uno y lo guarda. Un tratamiento de otra enfermedad se rechaza (400); sin diagnóstico confirmado, responde 409. |
| RF-48 | La tarjeta "Plan" tiene tres campos con los límites de `PLANES`: plan indicado de 3 a 1000 caracteres; pronóstico y seguimiento hasta 300. Al guardar, el plan se crea con el siguiente `IdPlan` (`PLAN_` + 5 dígitos) o, si ya existe, se actualiza. |
| RF-49 | "Descargar PDF" abre la impresión del navegador con el título "Expediente {ID} - {nombre}", que sirve de nombre sugerido del archivo; "Imprimir" abre la misma ventana. |
| RF-50 | En el buscador, los pacientes con diagnóstico tienen "Ver resultado". "Volver a la captura" abre `/home?paciente={ID}`, que retoma a ese paciente, y "Buscar paciente" abre `/home?buscar=1`. |

## 5. Capas

- **Backend:** `PatientResultController` → `IPatientResultService` / `PatientResultService` → `IPatientResultRepository` / `PatientResultRepository`.
  - Entidades: `Treatment` (`TRATAMIENTOS`) y `CarePlan` (`PLANES`).
  - DTOs: `ConfirmDiagnosisRequest`, `ChooseTreatmentRequest` y `SaveCarePlanRequest`.
  - Resultado: `PatientResult`.
- **Frontend:**
  - Página: `app/(app)/patients/[id]/result/page.tsx`. Lee el ID dentro de `<Suspense>`, como pide Next 16 con `cacheComponents`.
  - Vista: `components/result/PatientResultScreen.tsx` y `ResultSections.tsx`.
  - Servicio: `services/resultService.ts`.
  - Rutas: `app/api/patients/[id]/result`, `diagnosis`, `treatment` y `plan`.
  - Tipos: `types/result.ts`.

## 6. Casos de prueba

### PT59. Siguiente IdPlan [auto, xUnit]

- **Given** el mayor `IdPlan` es `PLAN_00010`, no hay ninguno o tiene otro formato.
- **When** se calcula el siguiente.
- **Then** es `PLAN_00011`, o `PLAN_00001` en los otros dos casos.

### PT60. Cambiar de enfermedad quita el tratamiento [auto, xUnit]

- **Given** un paciente con asma y su tratamiento elegido.
- **When** se confirma otra enfermedad.
- **Then** se guarda el diagnóstico nuevo y el tratamiento anterior se quita.

### PT61. Enfermedad inexistente [auto, xUnit]

- **Given** un paciente existente.
- **When** se confirma una enfermedad que no está en `ENFERMEDADES`.
- **Then** se rechaza y no se guarda nada.

### PT62. Elegir tratamiento [auto, xUnit]

- **Given** un paciente sin diagnóstico, y luego con asma confirmada.
- **When** se elige un tratamiento.
- **Then** sin diagnóstico responde `SinDiagnostico`. Con asma, uno de otra enfermedad se rechaza y uno del asma se guarda.

### PT63. Crear y actualizar el plan [auto, xUnit]

- **Given** un paciente sin plan.
- **When** el médico guarda su plan dos veces.
- **Then** se crea un solo plan, con el siguiente ID, y queda con el último texto, sin espacios sobrantes.

### PT64. Tratamiento inconsistente [auto, xUnit]

- **Given** un tratamiento guardado que no es de la enfermedad diagnosticada.
- **When** se consulta el resultado.
- **Then** se listan los tratamientos de esa enfermedad y ninguno aparece como indicado.

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

- **PT68.** Confirmar un candidato abre la salida con ese diagnóstico.
- **PT69.** Guardar un tratamiento lo marca como "Indicado".
- **PT70.** Guardar el plan lo deja en "Expediente de" como "Guardado".
- **PT71.** "Volver a la captura" retoma al mismo paciente.
