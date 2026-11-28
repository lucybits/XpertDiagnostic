# 13. Especificación: máquina de inferencia

| Campo | Valor |
|---|---|
| Identificador | ESP-010 |
| Origen | Decisión final del equipo (P-160): la máquina de inferencia del Ing. Antonio Castañeda de la Lanza (`inference_engine.prg`, XBase/Visual FoxPro) es el motor definitivo. Reemplaza al motor provisional; no habrá LLM ni RAG. |
| Estado | Implementada como copia literal del `.prg` (P-161) y evaluada con los pacientes de prueba: PT57, la enfermedad esperada está en la lista en 10 de 10. |
| Tareas | [tareas/maquina-de-inferencia.md](../tareas/maquina-de-inferencia.md), T57, T85 a T87, T103 y T104 |
| Casos de prueba | Sección 6 de este documento: PT55, PT57 y PT115 a PT121 |

## 1. Algoritmo original (`inference_engine.prg`)

Para cada paciente:

1. Toma sus síntomas (`io_sintomas`) y se queda con los que existen en la base de conocimiento (`bdc_sintomas`), comparando por **texto**.
2. Hace lo mismo con sus signos (`io_signos` contra `bdc_signos`).
3. De esas coincidencias saca las enfermedades (`id_enferme`), sin repetirlas (`INDEX ... UNIQUE`).
4. Agrega a cada enfermedad su nombre (`bdc_enfermedades`) y su primer tratamiento (`bdc_tratamientos`).
5. Escribe el resultado en `io_resultadosesperados`.

## 2. Conversión a C# y SQL Server

| `.prg` | Sistema |
|---|---|
| `io_sintomas`, `io_signos` | `HALLAZGOS_PACIENTE` (lo que captura el tratante) |
| `bdc_enfermedades`, `bdc_sintomas`, `bdc_signos`, `bdc_tratamientos` | `ENFERMEDADES`, `SINTOMAS`, `SIGNOS`, `TRATAMIENTOS` |
| Tablas temporales (`sintomas_temp`, `signos_temp`, `archivo_temp`) | Colecciones en memoria dentro de `InferenceEngine` |
| `io_resultadosesperados` | No se escribe: el resultado va al panel del tratante y lo valida el internista (ESP-008). `IO_ResultadosEsperados` sigue siendo la respuesta correcta para evaluar (PT57). |

**Decisiones del equipo sobre lo que el `.prg` deja abierto (Lucía, P-160):**

| Tema | En el `.prg` | En el sistema |
|---|---|---|
| Orden | `INDE ON enfermedad TO paso40 UNIQUE` + `COPY TO`: todas las enfermedades, una por nombre, en orden alfabético. El comentario dice "cuenta la enfermedad que aparece más veces", pero el código no cuenta. | **Copia literal (P-161):** todas las enfermedades encontradas, sin límite, una por nombre (si dos IDs comparten nombre queda el de menor ID) y en orden alfabético. Coincidencias y proporción se muestran como información, sin cambiar el orden. (En P-160 se había ordenado por coincidencias; Lucía lo cambió a copia literal.) |
| Entradas | Solo síntomas y signos (el encabezado menciona laboratorios, pero el código no los usa). | **Todos los hallazgos:** síntomas, signos, estudios de laboratorio y comorbilidades. Cada tipo se compara solo con su catálogo. |
| Comparación de texto | Igualdad exacta. | Ignora mayúsculas, acentos y espacios repetidos: la base del equipo escribe lo mismo de varias formas ("Melena" y "MELENA"). |
| `ZAP` | Borra los resultados de los pacientes anteriores en cada vuelta (error). | No aplica: se calcula un paciente a la vez y no se escriben tablas. |
| Límites de laboratorio | No se usan. | Tampoco. |

## 3. Requisitos funcionales

| ID | Requisito |
|---|---|
| RF-65 | Con los hallazgos guardados del paciente, la máquina devuelve todas las enfermedades que comparten al menos un hallazgo, en orden alfabético, cada una con coincidencias, total de criterios, proporción (puntaje), hallazgos que la apoyan y primer tratamiento. |
| RF-66 | Una enfermedad solo aparece si al menos un hallazgo del paciente es criterio suyo, comparando dentro del mismo tipo de hallazgo. |
| RF-67 | El tratante y el internista ven el "Tratamiento sugerido" de cada candidato. Ya no aparece la etiqueta "Motor provisional". |

## 4. Base de conocimiento

`LoadKnowledgeBase.sql` carga en SQL Server la base de conocimiento de los DBF del equipo: 924 enfermedades, 2,350 síntomas, 2,827 signos y 4,416 tratamientos. Solo agrega lo que falta (los 10 registros que ya existían se conservan).

Lo genera `Sql/Tools/generate_knowledge_base.ps1`, que **repara** 613 textos que la importación original partió en una coma. Por ejemplo, `"PELO ESCASO (PROTEÍNAS` + `biotina` se vuelve `PELO ESCASO (PROTEÍNAS, biotina…`. La enfermedad de cada registro se toma de su ID. Límites y dosis solo se cargan si son números.

Se corre **después** de `SeedClinicalData.sql`, porque ese script borra las tablas clínicas.

## 5. Capas

- `Services/InferenceEngine.cs` implementa `IInferenceEngine` y se registra en `Program.cs` (inversión de dependencias: `DiagnosisService` y la validación no cambian).
- `Repositories/ITreatmentRepository.cs` y `TreatmentRepository.cs` dan el primer tratamiento por enfermedad.
- `DiagnosisCandidate` agrega `TratamientoSugerido`.
- Se eliminó `ProvisionalInferenceEngine` (P-160) y después la propiedad `Provisional` de `IInferenceEngine` y de `DiagnosisResult` (P-168).
- Frontend: `DiagnosisPanel.tsx` (tratante) y `ValidationDetail.tsx` (internista) muestran el tratamiento sugerido.

## 6. Casos de prueba

### PT55. Todas las enfermedades en orden alfabético [auto, xUnit]

- **Given** un paciente con Disnea, Tos y Sibilancias.
- **When** se infiere.
- **Then** vienen asma, miocardiopatía y neumonía, por nombre (no por coincidencias), cada una con sus coincidencias como información.

### PT115. Nombre repetido [auto, xUnit]

- **Given** dos enfermedades con el mismo nombre que comparten el síntoma del paciente.
- **When** se infiere.
- **Then** queda una sola, la de menor ID (`UNIQUE` por nombre).

### PT116. Texto sin mayúsculas, acentos ni espacios [auto, xUnit]

- **Given** la base escribe "NÁUSEA" y el paciente trae "  nausea ".
- **When** se infiere.
- **Then** coincide.

### PT117. Todos los tipos de hallazgo [auto, xUnit]

- **Given** un estudio de laboratorio y una comorbilidad.
- **When** se infiere.
- **Then** cuentan para sus enfermedades, y un texto de otro tipo no se confunde.

### PT118. Primer tratamiento [auto, xUnit]

- **Given** candidatos con y sin tratamientos.
- **When** se infiere.
- **Then** cada uno trae su primer tratamiento, o nada si no tiene.

### PT119. Sin hallazgos o sin coincidencias [auto, xUnit]

- **Given** ningún hallazgo, o uno que no existe en la base.
- **When** se infiere.
- **Then** no hay candidatos.

### PT120. Sin límite de candidatos [auto, xUnit]

- **Given** un síntoma de ocho enfermedades.
- **When** se infiere.
- **Then** vienen las ocho, en orden por nombre.

### PT121. Normalización de texto [auto, xUnit]

- **Given** textos con acentos, minúsculas y espacios repetidos.
- **When** se normalizan.
- **Then** quedan iguales a su versión en mayúsculas, sin acentos y con un solo espacio.

### PT57. Evaluación con la base real [auto, integración]

- **Given** los 10 pacientes de prueba, la base de conocimiento completa (924 enfermedades) e `IO_ResultadosEsperados`.
- **When** se analiza cada paciente.
- **Then** la enfermedad esperada está en la lista en **10 de 10** (2026-11-25), entre 14 y 182 candidatos por paciente y en posiciones de la 3 a la 116 (orden alfabético). Con el orden por coincidencias de P-160 había salido primera en 10 de 10. Los pacientes de prueba traen los criterios completos de su enfermedad.
