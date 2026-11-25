# Tareas: validación del diagnóstico por el médico internista

Especificación: [ESP-008](../especificaciones/11-validacion-internista.md)

Cada tarea indica el requisito o la decisión que cumple, la prueba que la verifica y si la hizo una persona o un asistente de IA. La columna **Revisión humana** remite a [auditoria-humana.md](../auditoria/auditoria-humana.md). Una tarea hecha con IA solo cuenta como terminada cuando una persona del equipo la revisó.

Leyenda: `[x]` implementada · `[ ]` pendiente.

| # | Tarea | Cumple | Prueba | Hecha por | Revisión humana |
|---|---|---|---|---|---|
| [x] T72 | Aviso simulado de envío a validación del médico internista y del comité (primera versión, reemplazada por T73 a T76). | Decisión del equipo | — | Castañeda (commit 36a01ff; P-141) | — |
| [x] T73 | Estado de validación en `PACIENTES` (`P`, `C` o sin enviar), con quién lo envió, quién lo confirmó y cuándo (`AddDiagnosisValidation.sql`). | RF-53 a RF-60 | PT106 | IA (P-151) | Pendiente |
| [x] T74 | `DiagnosisValidationService` y API: enviar (`T`), consultar el estado (`T` e `I`), listar pendientes y confirmados y confirmar (`I`). Solo se confirma un candidato del análisis actual y solo si el tratante lo envió. | RF-53, RF-55, RF-57, RF-59 | PT101 a PT105, PT60, PT61, PT107 | IA (P-151) | Pendiente |
| [x] T75 | Pantalla `/internista`: Pendientes y Confirmados con buscador, detalle con hallazgos, candidatos y tratamiento sugerido, y "Confirmar diagnóstico" / "Cambiar a este diagnóstico". | RF-55, RF-56 | PT108b | IA (P-151) | Pendiente |
| [x] T76 | Avisos del tratante: "Enviado a validación del médico internista" y "{enfermedad}: confirmado por el médico internista {nombre}", con "Volver a enviar al internista". | RF-54, RF-58 | PT108a, PT108c | IA (P-151, P-158) | Pendiente |
| [x] T77 | Un diagnóstico cargado sin pasar por el internista (pacientes de prueba) no cuenta como confirmado. | RF-58 | PT106 | IA (P-152; A-28) | A-28 (corregido) |
| [x] T78 | El internista puede corregir un diagnóstico ya confirmado. | RF-60 | PT109 | IA (P-153) | Pendiente |
| [ ] T79 | Ejecutar a mano PT108 (pantallas del tratante y del internista). | R-PRU-01 | PT108 | Equipo | — |
