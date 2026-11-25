# Tareas: pantalla principal del médico tratante

Estructura visual de `/home`: barra lateral, barra superior, buscador y panel del expediente. No tiene una especificación propia; la captura y el análisis están en [ESP-005](../especificaciones/08-captura-y-analisis.md).

Cada tarea indica el requisito o la decisión que cumple, la prueba que la verifica y si la hizo una persona o un asistente de IA. La columna **Revisión humana** remite a [auditoria-humana.md](../auditoria/auditoria-humana.md).

Leyenda: `[x]` implementada · `[ ]` pendiente.

| # | Tarea | Cumple | Prueba | Hecha por | Revisión humana |
|---|---|---|---|---|---|
| [x] T29 | Renombrar carpetas y archivos de código al inglés; la ruta principal pasa a `/home`. | R-ARQ-07 | `npm run lint` | IA (P-09) | Pendiente |
| [x] T30 | Barra lateral: buscar paciente y secciones del expediente con su estado. | Decisión de Lucía | — | IA (P-10) | Pendiente |
| [x] T31 | Barra superior: saludo según la hora con el nombre del médico, fecha, ayuda y menú de cuenta. | Decisión de Lucía | — | IA (P-13) | A-06 (corregido) |
| [x] T32 | Buscador de pacientes en ventana modal: búsqueda por nombre o expediente y filtros de edad y diagnóstico. Conectado a la API en T50. | Decisión de Lucía (P-40) | PT40 | IA (P-31) | Pendiente |
| [x] T40 | Panel derecho "Expediente": ficha del paciente, avance de la captura, hallazgos por tipo, diagnóstico diferencial y acceso al resultado. Columna fija en `xl`, cajón en pantallas menores. | Decisión de Lucía | PT58 | IA (P-42, P-110) | Pendiente |
| [x] T42 | Captura sección por sección: las pendientes se bloquean con candado en la barra lateral y al guardar se avanza a la siguiente. | Decisión de Lucía | PT58 | IA (P-45) | Pendiente |
| [x] T47 | Barra superior plegable y expediente plegable (lomo con avance vertical e íconos de hallazgos). | Decisión de Lucía | — | IA (P-75) | Pendiente |
| [x] T94 | Corregir la recarga en bucle en desarrollo (`experimental.mcpServer: false` en `next.config.ts`). | Calidad | — | IA (P-155) | Pendiente |
| [x] T105 | Esquinas cuadradas en todo el sitio, excepto íconos (radio 0 en el tema de Tailwind). | Decisión de Lucía | `tsc`, `eslint` | IA (sin entrada en la bitácora) | Pendiente |
