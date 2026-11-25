# Tareas: registrar un paciente nuevo

Especificación: [ESP-004](../especificaciones/07-nuevo-paciente.md)

Cada tarea indica el requisito o la decisión que cumple, la prueba que la verifica y si la hizo una persona o un asistente de IA. La columna **Revisión humana** remite a [auditoria-humana.md](../auditoria/auditoria-humana.md). Una tarea hecha con IA solo cuenta como terminada cuando una persona del equipo la revisó.

Leyenda: `[x]` implementada · `[ ]` pendiente.

| # | Tarea | Cumple | Prueba | Hecha por | Revisión humana |
|---|---|---|---|---|---|
| [x] T48 | Modelo del alta de paciente: `validateNewPatient`, `nextPatientId` y `createPatient` (`lib/newPatient.ts`), con PT35 a PT39 verificadas. | ESP-004 | PT35 a PT39 | IA (P-99, P-100) | Pendiente |
| [x] T49 | Ventana "Nuevo paciente" y entradas desde la barra lateral y el buscador. | ESP-004 | PT40 | IA (P-99) | Pendiente |
| [x] T50 | Guardar el paciente en `PACIENTES` y listar desde la base: `GET`/`POST /api/patients`, `PatientService` y `patientService` del frontend. | ESP-004 | PT42 a PT45 | IA (P-102) | Pendiente |
| [x] T69 | El alta y la baja de pacientes pasan al administrador; el tratante solo busca y captura. Eliminar un paciente borra también sus hallazgos, antecedentes y plan. | Estructura final de roles (P-144) | `PatientServiceTests` | Equipo (commits 2d16977, 04a348c) e IA | — |
| [x] T102 | Sexo y fecha de nacimiento en el alta (la edad se calcula). | Decisión del equipo | `PatientServiceTests` | Equipo (commit 793b09c) | — |
