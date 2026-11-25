# Tareas: captura del expediente y análisis

Especificación: [ESP-005](../especificaciones/08-captura-y-analisis.md)

Cada tarea indica el requisito o la decisión que cumple, la prueba que la verifica y si la hizo una persona o un asistente de IA. La columna **Revisión humana** remite a [auditoria-humana.md](../auditoria/auditoria-humana.md). Una tarea hecha con IA solo cuenta como terminada cuando una persona del equipo la revisó.

Leyenda: `[x]` implementada · `[ ]` pendiente.

| # | Tarea | Cumple | Prueba | Hecha por | Revisión humana |
|---|---|---|---|---|---|
| [x] T51 | Catálogos de solo lectura: `GET /api/catalogs/{nombre}` (síntomas, signos, estudios de laboratorio, comorbilidades, enfermedades). | ESP-005 | PT46, PT48 | IA (P-102) | Pendiente |
| [x] T52 | Captura estructurada por sección: elegir del catálogo, guardar en `HALLAZGOS_PACIENTE` y llenar "Hallazgos registrados". | ESP-005 | PT49 a PT52, PT54, PT56 | IA (P-103) | Pendiente |
| [x] T53 | Avance real entre secciones: guardar completa la sección y desbloquea la siguiente; retomar marca las que ya tienen datos. Las secciones completadas se pueden abrir y corregir. | ESP-005 | PT58 | IA (P-103, P-136) | Pendiente |
| [x] T54 | "Analizar": `IInferenceEngine` con implementación provisional (inversión de dependencias). Desde P-160 la implementación es la máquina del equipo (ESP-010). | ESP-005 | PT55, PT57 | IA (P-103) | Pendiente |
| [ ] T55 | Ejecutar a mano PT58 (flujo completo con sesión). | R-PRU-01 | PT58 | Equipo | — |
| [x] T91 | Análisis desactualizado: si se guardan hallazgos después de analizar, se avisa y no se puede enviar al internista hasta volver a analizar. | ESP-005 | PT58 | IA (P-112, P-163) | Pendiente |
| [x] T92 | Orden nuevo de las secciones: interrogatorio, signos, síntomas, estudios y laboratorios, comorbilidades y diagnóstico diferencial; sin "Enfermedades preexistentes". | Decisión del equipo | PT58 | Equipo (P-144, P-147) | — |
| [x] T93 | Retirar el chat, la bienvenida y el recorrido guiado; la captura queda en `SectionWorkspace` con un aviso para buscar paciente. | Decisión de Lucía | `tsc`, `eslint` | IA (P-154) | Pendiente |
