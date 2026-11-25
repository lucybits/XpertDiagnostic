# 08. Especificación: captura estructurada del expediente y análisis

| Campo | Valor |
|---|---|
| Identificador | ESP-005 |
| Origen | P-102 y P-103: conectar la estructura visual con la lógica antes de tener la máquina de inferencia o el RAG. |
| Estado | Implementada. Desde P-160 la máquina de inferencia es la del equipo (ESP-010, [13-maquina-de-inferencia.md](13-maquina-de-inferencia.md)). Falta probar el flujo con sesión iniciada. |
| Tareas | [tareas/captura-y-analisis.md](../tareas/captura-y-analisis.md), T51 a T55 y T91 a T93 |
| Casos de prueba | Sección 6 de este documento, PT49 a PT57 |

## 1. Objetivo

Que el médico capture las **entradas** de la máquina de inferencia de forma estructurada y que el sistema produzca la **salida**: el diagnóstico diferencial. `PACIENTES` es una tabla de entrada y salida (Axel, P-102):

- **Entradas:** el paciente, la enfermedad preexistente y los hallazgos (síntomas, signos, estudios de laboratorio y comorbilidades).
- **Salidas:** la enfermedad diagnosticada, el tratamiento y el plan.

## 2. Decisiones de Lucía (P-103)

| Tema | Decisión |
|---|---|
| Descripciones repetidas en los catálogos (cada enfermedad tiene su "Disnea") | El médico ve una sola opción. Al guardar, se guardan **todos los IDs** con esa descripción, para que la máquina pueda comparar por ID contra cualquier enfermedad. |
| Secciones sin tabla (antecedentes patológicos, no patológicos, alergias, quirúrgicos) | Se quitaron. Las secciones quedan **alineadas con el modelo**. |
| Varias comorbilidades | Se guardan en `HALLAZGOS_PACIENTE` (tipo `Comorbilidad`). La columna `PACIENTES.IdComorbilidad` queda sin usar por ahora. |

**Criterio:** un sistema experto razona con IDs del catálogo, no con texto libre. Por eso la captura es estructurada. Decisión final del equipo (P-160): no hay LLM ni RAG; el diagnóstico lo calcula solo la máquina de inferencia del equipo.

## 3. Secciones

| Grupo | Sección | Catálogo | Dónde se guarda |
|---|---|---|---|
| Antecedentes | Enfermedades preexistentes | `ENFERMEDADES` | `PACIENTES.IdEnfermedadPreexistente` (una) |
| Antecedentes | Comorbilidades | `COMORBILIDADES` | `HALLAZGOS_PACIENTE`, tipo `Comorbilidad` |
| Evaluación clínica | Síntomas | `SINTOMAS` | `HALLAZGOS_PACIENTE`, tipo `Sintoma` |
| Evaluación clínica | Signos | `SIGNOS` | `HALLAZGOS_PACIENTE`, tipo `Signo` |
| Evaluación clínica | Estudios de laboratorio | `ESTUDIOS_LABORATORIO` | `HALLAZGOS_PACIENTE`, tipo `Estudio_lab` |
| Resultado | Diagnóstico diferencial | — | Lo calcula la máquina de inferencia; todavía no se guarda |

## 4. Requisitos funcionales

| ID | Requisito |
|---|---|
| RF-35 | Los catálogos se consultan con `GET /api/catalogs/{nombre}` (sintomas, signos, estudios-laboratorio, comorbilidades, enfermedades). Cualquier otro nombre responde 404. |
| RF-36 | En cada sección de captura, el médico busca en el catálogo, sin distinguir acentos ni mayúsculas, y marca lo que presenta el paciente. Cada descripción aparece una sola vez. |
| RF-37 | Si el elemento tiene unidades, el médico puede anotar un valor numérico (acepta coma o punto decimal). Si no lo anota, se guarda "presente". |
| RF-38 | "Guardar y continuar" reemplaza los hallazgos de ese tipo (`PUT /api/patients/{id}/findings/{seccion}`). Por cada elegido se guardan todos sus IDs equivalentes. Si un ID no es del catálogo, no se guarda nada (400). Guardar sin elegir nada también es válido y se muestra como "Continuar sin…". |
| RF-39 | En "Enfermedades preexistentes" se elige una o ninguna (`PUT /api/patients/{id}/preexisting-disease`). |
| RF-40 | Al guardar, la sección queda completada y se pasa a la primera sin completar. Al elegir un paciente con datos, se marcan completadas las secciones que ya tienen datos y se retoma en la primera que no los tiene. |
| RF-41 | El panel "Expediente" muestra la enfermedad preexistente y los hallazgos guardados, agrupados por tipo y sin repetir descripciones. |
| RF-42 | "Analizar expediente" (`POST /api/patients/{id}/analysis`) muestra hasta 5 enfermedades probables con su porcentaje de coincidencia, los criterios, los hallazgos que las apoyan y su tratamiento sugerido (ESP-010). Analizar no guarda nada; el diagnóstico se guarda solo cuando el médico internista confirma un candidato (ESP-008). |
| RF-43 | La máquina de inferencia es una interfaz (`IInferenceEngine`, inversión de dependencias). Cambiar de implementación solo requiere registrarla en `Program.cs`. Ninguna implementación lee `RESULTADOS_ESPERADOS`. |
| RF-51 | Si se guarda una sección después de analizar, el análisis queda **desactualizado**: el panel del análisis muestra un aviso y deshabilita "Confirmar este diagnóstico", y el panel del expediente lo marca y lo atenúa. Al volver a analizar se quita la marca (P-112). |

## 5. Máquina de inferencia

El motor provisional (`ProvisionalInferenceEngine`) se retiró en P-160. La máquina de inferencia es ahora la del equipo, convertida de `inference_engine.prg`: ver [13-maquina-de-inferencia.md](13-maquina-de-inferencia.md) (ESP-010).

## 6. Casos de prueba

### PT49. Descripción repetida guarda todos sus IDs [auto, xUnit]

- **Given** "Disnea" existe en dos enfermedades.
- **When** el médico la elige.
- **Then** se guardan los dos IDs como "presente".

### PT50. Registro fuera del catálogo [auto, xUnit]

- **Given** un paciente con hallazgos guardados.
- **When** se envía un ID que no es del catálogo de la sección.
- **Then** responde `RegistroInvalido` y no se modifica nada.

### PT51. Paciente inexistente [auto, xUnit]

- **Given** un ID de paciente que no existe.
- **When** se guardan hallazgos.
- **Then** responde `PacienteNoExiste` y no se guarda nada.

### PT52. Medición con unidades [auto, xUnit]

- **Given** un signo con unidades "rpm".
- **When** se guarda con el valor 28.
- **Then** se guardan "28" y "rpm".

### PT53. Enfermedad preexistente inválida [auto, xUnit]

- **Given** un paciente existente.
- **When** se asigna una enfermedad que no existe, o una que sí existe.
- **Then** la primera se rechaza y la segunda se guarda.

### PT54. Equivalentes se muestran una vez [auto, xUnit]

- **Given** "Disnea" guardada con sus dos IDs.
- **When** se consulta el expediente.
- **Then** aparece una sola vez.

### PT55. Orden de la máquina de inferencia

Pasó a [13-maquina-de-inferencia.md](13-maquina-de-inferencia.md) con el motor del equipo (P-160).

### PT56. Expediente real agrupado [auto, integración, solo lectura]

- **Given** el paciente de prueba `PACIE00001`.
- **When** se consulta su expediente en la base real.
- **Then** trae hallazgos con descripción, sin repetir descripciones dentro de un mismo tipo.

### PT57. Evaluación del motor contra `RESULTADOS_ESPERADOS` [auto, integración, solo lectura]

- **Given** los 10 pacientes de prueba.
- **When** se analiza cada uno.
- **Then** se informa la exactitud: hoy 10 de 10 (ver el límite en la sección 5). La prueba queda lista para evaluar la máquina de inferencia real.

### PT58. Flujo completo con sesión [manual]

- **Given** una sesión iniciada y un paciente registrado.
- **When** el médico guarda cada sección y pulsa "Analizar expediente".
- **Then** cada sección queda completada y se desbloquea la siguiente; el panel muestra los hallazgos y el diagnóstico diferencial aparece con la etiqueta "provisional".
