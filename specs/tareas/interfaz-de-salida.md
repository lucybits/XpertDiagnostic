# Tareas: interfaz de salida del expediente

Especificación: [ESP-006](../especificaciones/09-interfaz-de-salida.md)

Cada tarea indica el requisito o la decisión que cumple, la prueba que la verifica y si la hizo una persona o un asistente de IA. La columna **Revisión humana** remite a [auditoria-humana.md](../auditoria/auditoria-humana.md). Una tarea hecha con IA solo cuenta como terminada cuando una persona del equipo la revisó.

Leyenda: `[x]` implementada · `[ ]` pendiente.

| # | Tarea | Cumple | Prueba | Hecha por | Revisión humana |
|---|---|---|---|---|---|
| [x] T56 | Confirmar el diagnóstico y guardar las salidas en `PACIENTES` y `PLANES`: el médico elige el tratamiento y escribe el plan. Reemplazada por T88: desde P-164 la salida es de solo lectura. | RF-45 a RF-48 | PT64, PT65 | IA (P-105) | Pendiente |
| [x] T58 | Interfaz de salida `/patients/{id}/result` según el boceto: historia clínica, diagnóstico, tratamiento, plan, Descargar PDF e Imprimir, con sus enlaces desde el análisis y el buscador. | RF-46, RF-49, RF-50 | PT66, PT67 | IA (P-105) | Pendiente |
| [ ] T59 | Ejecutar a mano PT71 con sesión, con la API reiniciada (PT68 pasó a PT108; PT69 y PT70 se retiraron en P-164). | R-PRU-01 | PT71 | Equipo | — |
| [x] T90 | Correcciones de la salida: primera hoja vacía en el PDF, clics que no respondían al entrar desde el buscador y "Volver a la captura" que no abría al paciente. | RF-49, RF-50 | PT67, PT71 | IA (P-106, P-107, P-108) | Pendiente |
| [x] T88 | Salida de solo lectura ligada a la confirmación del internista: sin confirmación no hay diagnóstico, tratamiento ni plan; el tratamiento indicado es el primero de la enfermedad y el plan lista sus tratamientos. Se quitaron `PUT treatment` y `PUT plan`. | RF-47, RF-48, RF-68 | PT64, PT122, PT123, PT65 | IA (P-164) | Pendiente |
| [x] T89 | "Ver resultado" bloqueado (panel del expediente) u oculto (buscador) mientras el diagnóstico esté pendiente o sin validar. | RF-50, RF-68 | PT108c | IA (P-165) | Pendiente |
