# 07. Especificación: registrar un paciente nuevo

| Campo | Valor |
|---|---|
| Identificador | ESP-004 |
| Origen | Petición de Lucía (P-99): cómo se agrega un paciente nuevo, con qué botones y cómo lo explica el recorrido. |
| Estado | Implementada: el alta se guarda en `PACIENTES` y el buscador lee de la base de datos (P-102) |
| Tareas | [tareas/inicio-sesion.md](../tareas/inicio-sesion.md), T48 a T50 |
| Casos de prueba | Sección 6 de este documento, PT35 a PT48 |

## 1. Objetivo

Permitir que el médico abra el expediente de un paciente que todavía no está registrado, sin salir del flujo del chat.

## 2. Decisiones de Lucía

- **Formulario, no IA.** El alta se hace con un formulario. El chat solo explica la opción y ofrece el botón.
  - La identidad del paciente es un dato crítico: un error de interpretación de la IA crearía un expediente equivocado.
  - Son solo dos datos fijos, que se validan al instante.
  - El formulario no depende de `ai-service`, que todavía no existe.
- **A futuro (opcional):** la IA podría abrir el formulario ya prellenado a partir de lo que escriba el médico. El médico siempre confirma.
- **Solo nombre completo y edad.** Son las columnas obligatorias de `PACIENTES`, y la tabla no se amplía (A-11). El ID se asigna solo. Diagnóstico, comorbilidad, tratamiento y plan se llenan después, con lo que se capture en el chat.
- **"Buscar paciente" sigue siendo la acción principal.** "Nuevo paciente" es secundaria: tiene borde y no tiene relleno.

## 3. Requisitos funcionales

| ID | Requisito |
|---|---|
| RF-28 | La barra lateral muestra "Nuevo paciente" debajo de "Buscar paciente", como acción secundaria. Con la barra contraída queda solo el ícono, con su etiqueta flotante. |
| RF-29 | El buscador ofrece "Registrar nuevo paciente": destacado cuando no hay resultados y como enlace al pie cuando sí los hay. |
| RF-30 | El último paso del recorrido dice: "Para empezar, **busca a un paciente registrado** o **registra uno nuevo**: solo necesito su **nombre completo** y su **edad**. El resto lo iremos capturando juntos, sección por sección." Debajo van los botones "Buscar paciente" (principal) y "Nuevo paciente" (secundario). |
| RF-31 | La ventana "Nuevo paciente" pide nombre completo y edad. El nombre lleva de 3 a 150 caracteres, con al menos una letra y sin números. La edad es un entero de 0 a 130. Los errores se muestran junto a cada campo y el foco va al primero con error. |
| RF-32 | Al registrar, el **servidor** asigna el siguiente `IdPaciente` (`PACIE` + 5 dígitos). Si otro médico tomó ese ID al mismo tiempo, reintenta con el siguiente. Guarda solo nombre y edad; el paciente queda seleccionado y el chat abre la primera sección. Si falla (sin sesión, sin conexión), la ventana muestra el motivo y no se cierra. |
| RF-34 | El buscador lee los pacientes de `PACIENTES` con el nombre de su diagnóstico, al iniciar sesión y cada vez que se abre. |
| RF-33 | Con un paciente seleccionado, una píldora fija arriba a la izquierda del chat muestra su nombre y su número de expediente, también con el encabezado oculto. La portada dice "Empecemos con {grupo}: / {sección}" y "Escribe en el chat lo que sepas del paciente sobre esta sección." (P-100, P-101). |

## 4. Capas (R-ARQ-01)

| Capa | Archivo | Contenido |
|---|---|---|
| Modelo | `frontend/types/patient.ts` | `PATIENT_LIMITS`, `PATIENT_ID_PREFIX`, `NewPatient`. |
| Modelo | `frontend/lib/newPatient.ts` | `validateNewPatient`, `nextPatientId`, `createPatient`, con contratos `@pre`/`@post`. |
| Vista | `frontend/components/home/NewPatientDialog.tsx` | La ventana, con `<dialog>` nativo como el buscador. |
| Vista | `Sidebar.tsx`, `PatientSearchDialog.tsx`, `components/assistant/*` | Puntos de entrada. |
| Controlador | `frontend/services/patientService.ts`, `frontend/app/api/patients/route.ts` | `listPatients` y `registerPatient`. La ruta valida y reenvía con la cookie de sesión. |
| Backend | `PatientsController`, `IPatientService`/`PatientService`, `IPatientRepository`/`PatientRepository`, `Patient`, `Disease`, `CreatePatientRequest`, `PatientSummary` | `GET /api/patients` y `POST /api/patients`, con token. El servicio asigna el ID (`SiguienteId`). |

## 5. Pendiente

- Nada en el alta. La captura de hallazgos se especificará aparte (P-102, paso 3).

## 6. Casos de prueba

Los casos marcados con `[auto]` se verificaron con `tsx`. Los demás se recorrieron en Edge sin interfaz.

### PT35. Nombre y edad válidos [auto]

- **Given** el nombre "  María   López  " y la edad "52".
- **When** se valida el alta.
- **Then** es válida, con el nombre "María López" y la edad 52.

### PT36. Campos vacíos [auto]

- **Given** el nombre y la edad vacíos.
- **When** se valida el alta.
- **Then** hay un error en cada campo.

### PT37. Nombre con números [auto]

- **Given** el nombre "111" o "Ana 2".
- **When** se valida el alta.
- **Then** el nombre es inválido. "María José Núñez" y "O'Connor-Pérez" sí son válidos.

### PT38. Edad fuera de rango o no entera [auto]

- **Given** la edad "131", "-1" o "4.5".
- **When** se valida el alta.
- **Then** la edad es inválida. "0" es válida.

### PT39. Siguiente ID

Reemplazado por PT42: el ID ahora lo asigna el servidor (P-102).

### PT40. Registrar desde la barra lateral

- **Given** la pantalla principal sin paciente.
- **When** el médico pulsa "Nuevo paciente", escribe "María López Hernández" y 52, y pulsa "Registrar y comenzar".
- **Then** la ventana se cierra, el nombre aparece en la barra lateral y el chat muestra "Empecemos con antecedentes: Patológicos".

### PT41. Recorrido con dos opciones

- **Given** el recorrido en su último paso.
- **When** termina de escribirse el mensaje.
- **Then** se ven "Buscar paciente" y "Nuevo paciente". El segundo abre la ventana de alta.

### PT42. Siguiente ID en el servidor [auto, xUnit]

- **Given** el mayor ID `PACIE00009` (o ninguno, o uno con otro formato).
- **When** se calcula el siguiente.
- **Then** es `PACIE00010` (o `PACIE00001`).

### PT43. El alta guarda solo las entradas [auto, xUnit]

- **Given** pacientes hasta `PACIE00010`.
- **When** se registra "  María   López  ", 52.
- **Then** se guarda `PACIE00011` con "María López", y las columnas de salida (diagnóstico, tratamiento, plan) quedan en null.

### PT44. Dos médicos a la vez [auto, xUnit]

- **Given** que otro médico ocupó el ID calculado justo antes de guardar.
- **When** se registra el paciente.
- **Then** se reintenta y se guarda con el siguiente ID libre.

### PT45. Reglas del alta en el backend [auto, xUnit]

- **Given** solicitudes con "111", "Ana 2", "Al", o con edad 131 o -1.
- **When** ASP.NET Core las valida.
- **Then** se rechazan (400). "María José Núñez" y "O'Connor-Pérez", con edad de 0 a 130, se aceptan.

### PT46. Catálogos admitidos [auto, xUnit]

- **Given** el nombre del catálogo en la URL.
- **When** se interpreta.
- **Then** solo son válidos sintomas, signos, estudios-laboratorio, comorbilidades y enfermedades.

### PT47. Pacientes desde la base real [auto, integración, solo lectura]

- **Given** la base con los pacientes de prueba del equipo.
- **When** se listan y se pide el último ID.
- **Then** todos tienen el formato `PACIE` + 5 dígitos, el último ID es el mayor y hay pacientes con diagnóstico.

### PT48. Catálogos desde la base real [auto, integración, solo lectura]

- **Given** la base de conocimiento cargada.
- **When** se lee cada uno de los 5 catálogos.
- **Then** traen elementos con ID y descripción. Solo el de enfermedades no tiene `IdEnfermedad`.
