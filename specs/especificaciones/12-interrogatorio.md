# 12. Especificación: interrogatorio del paciente

| Campo | Valor |
|---|---|
| Identificador | ESP-009 |
| Origen | Decisión del equipo, comunicada por Lucía (P-159): "El médico tratante es quien llena el formulario interrogatorio y también las secciones". El interrogatorio son los antecedentes no patológicos (`IO_AntecNoPatolPacientes`) y patológicos (`IO_AntecPatolPacientes`). |
| Estado | Implementado. Falta probarlo con sesión y revisarlo en pantalla (PT114). |
| Tareas | [tareas/interrogatorio.md](../tareas/interrogatorio.md), T80 a T84 |
| Casos de prueba | Sección 5 de este documento: PT110 a PT114 |

## 1. Flujo

El interrogatorio es el primer grupo del menú del médico tratante, antes de la evaluación clínica:

```
Interrogatorio: Antecedentes no patológicos → Antecedentes patológicos → Hipótesis inicial
Evaluación clínica: Signos → Síntomas → Estudios y laboratorios → Comorbilidades
Resultado: Diagnóstico diferencial
```

Sigue la misma regla que las demás secciones: se captura en orden, la siguiente se desbloquea al guardar ("Guardar y continuar") y al retomar a un paciente se marcan como completas las partes ya guardadas.

## 2. Requisitos funcionales

| ID | Requisito |
|---|---|
| RF-61 | **No patológicos:** siete preguntas de sí o no (tabaquismo, alcohol, drogas, humo de leña o biomasa, tatuajes o perforaciones, herbolaria y transfusiones). Empiezan en "No" y se guardan las siete. |
| RF-62 | **Patológicos:** veintiún campos de texto libre (alergias, crónico-degenerativos, endocrinológicos, cardiológicos, dislipidemias, pulmonares, neumológicos, gastrointestinales, urológicos y renales, neurológicos, psiquiátricos, reumatológicos, osteomusculares, dermatológicos, oftalmológicos, otorrinolaringológicos, infectológicos, hematológicos, oncológicos, ginecológicos y traumatismos). Hasta 255 caracteres cada uno; en blanco = sin antecedentes de ese tipo (se guarda null). |
| RF-63 | Guardar crea la fila del paciente o la reemplaza: siempre queda una por paciente en cada tabla. |
| RF-64 | Solo el médico tratante guarda (`T`); los médicos (`T` e `I`) consultan. |
| RF-69 | (P-167) **Hipótesis inicial:** después de los antecedentes y antes de los signos, el tratante escribe su impresión diagnóstica (de 3 a 1000 caracteres) en `PACIENTES.HipotesisInicial`, con `PUT api/patients/{id}/hypothesis` (solo `T`). La sección queda completa si ya hay una hipótesis guardada. No entra a la máquina de inferencia. |

## 3. Datos

Usa las tablas del equipo de base de datos sin cambios: `IO_AntecNoPatolPacientes` (7 columnas `BIT`) e `IO_AntecPatolPacientes` (21 columnas `NVARCHAR(255)`), una fila por paciente con llave `Id_Paciente`. Al eliminar a un paciente se borran con él (ya estaba en `PatientRepository`).

## 4. Capas

- **Backend:**
  - Controlador: `PatientHistoryController`.
    - `GET /api/patients/{id}/history` (T, I).
    - `PUT .../history/no-patologicos` y `PUT .../history/patologicos` (T).
  - Servicio: `IPatientHistoryService` / `PatientHistoryService`. Traduce los nombres abreviados de las columnas y limpia los textos.
  - Repositorio: `IPatientHistoryRepository` / `PatientHistoryRepository`.
  - Entidades: `NonPathologicalHistory` (ya existía) y `PathologicalHistory` (nueva).
  - DTO: `NonPathologicalHistoryData` y `PathologicalHistoryData`. Resultado: `PatientHistory`.
- **Frontend:**
  - Vista: `components/capture/HistoryCapture.tsx`, desde `SectionWorkspace`. Secciones en `components/home/clinicalSections.ts`; `HomeScreen` carga el interrogatorio junto con el expediente.
  - Servicio: `services/historyService.ts`. Tipos: `types/history.ts` y las preguntas de `types/patient.ts`.
  - Rutas: `app/api/patients/[id]/history`, `history/no-patologicos` y `history/patologicos`.

## 5. Casos de prueba

### PT110. Paciente sin interrogatorio [auto, xUnit]

- **Given** un paciente sin antecedentes guardados, y un ID que no existe.
- **When** se consultan.
- **Then** el primero trae las dos partes en null y el segundo no existe.

### PT111. Corregir no patológicos [auto, xUnit]

- **Given** un paciente sin antecedentes no patológicos.
- **When** el tratante responde y después corrige una respuesta.
- **Then** queda una sola fila con las respuestas corregidas.

### PT112. Textos de patológicos [auto, xUnit]

- **Given** un paciente sin antecedentes patológicos.
- **When** el tratante escribe con espacios sobrantes y deja campos en blanco.
- **Then** se guardan sin espacios y los vacíos quedan como null.

### PT113. Paciente inexistente [auto, xUnit]

- **Given** un ID que no existe.
- **When** se guardan antecedentes.
- **Then** no se guarda nada.

### PT124. Hipótesis inicial en pantalla [manual, pendiente]

- **Given** un paciente con el interrogatorio guardado y sin hipótesis.
- **When** el tratante abre "Hipótesis inicial", escribe menos de 3 caracteres y luego un texto válido, y guarda.
- **Then** con el texto corto aparece el aviso y no se guarda; con el válido, la sección queda completa y se abre "Signos". Al volver a abrirla, aparece el texto guardado. La regla del backend la prueba `GuardarHipotesis_TextoConEspacios_SeGuardaLimpio` en `PatientRecordServiceTests`.

### PT114. Flujo en pantalla [manual, pendiente]

- **Given** un paciente nuevo abierto por el tratante.
- **When** responde los no patológicos, llena algunos patológicos y avanza.
- **Then** cada parte queda completa en el menú, se desbloquea Signos y, al volver a abrir al paciente, los datos siguen ahí.
