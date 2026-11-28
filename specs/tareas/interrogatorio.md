# Tareas: interrogatorio del paciente

Especificación: [ESP-009](../especificaciones/12-interrogatorio.md)

Cada tarea indica el requisito o la decisión que cumple, la prueba que la verifica y si la hizo una persona o un asistente de IA. La columna **Revisión humana** remite a [auditoria-humana.md](../auditoria/auditoria-humana.md). Una tarea hecha con IA solo cuenta como terminada cuando una persona del equipo la revisó.

Leyenda: `[x]` implementada · `[ ]` pendiente.

| # | Tarea | Cumple | Prueba | Hecha por | Revisión humana |
|---|---|---|---|---|---|
| [x] T80 | Casillas de antecedentes no patológicos al registrar al paciente (primera versión; el interrogatorio pasó al tratante en T81 a T83). | Decisión del equipo | — | Equipo (commit cd2bc84; P-148) | — |
| [x] T81 | Entidad de antecedentes patológicos (21 campos) y repositorio que crea o reemplaza la fila del paciente en `IO_AntecNoPatolPacientes` e `IO_AntecPatolPacientes`. | RF-61 a RF-63 | PT110 a PT112 | IA (P-159) | Pendiente |
| [x] T82 | API `api/patients/{id}/history`: consultar (`T` e `I`) y guardar no patológicos y patológicos (`T`). | RF-63, RF-64 | PT113 | IA (P-159) | Pendiente |
| [x] T83 | Formulario del grupo "Interrogatorio" antes de las secciones: siete preguntas de sí o no y 21 campos de texto; al guardar se pasa a la siguiente sección. | RF-61, RF-62 | PT114 | IA (P-159) | Pendiente |
| [ ] T84 | Ejecutar a mano PT114 y revisar el formulario en pantalla. | R-PRU-01 | PT114 | Equipo | — |
| [x] T106 | Backend de la hipótesis inicial: columna `HipotesisInicial`, `PUT api/patients/{id}/hypothesis` y su ruta y servicio del frontend. | RF-69 | `PatientRecordServiceTests` | Equipo (commit d844439) | — |
| [x] T107 | Sección "Hipótesis inicial" después del interrogatorio y antes de los signos (`HypothesisCapture`). | RF-69 | PT124 | IA (P-167) | Pendiente |
| [ ] T108 | Ejecutar a mano PT124. | R-PRU-01 | PT124 | Equipo | — |
