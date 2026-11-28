# Tareas: máquina de inferencia

Especificación: [ESP-010](../especificaciones/13-maquina-de-inferencia.md)

Cada tarea indica el requisito o la decisión que cumple, la prueba que la verifica y si la hizo una persona o un asistente de IA. La columna **Revisión humana** remite a [auditoria-humana.md](../auditoria/auditoria-humana.md). Una tarea hecha con IA solo cuenta como terminada cuando una persona del equipo la revisó.

Leyenda: `[x]` implementada · `[ ]` pendiente.

| # | Tarea | Cumple | Prueba | Hecha por | Revisión humana |
|---|---|---|---|---|---|
| [x] T57 | Reemplazar `ProvisionalInferenceEngine` por la máquina de inferencia del equipo (`InferenceEngine`, conversión de `inference_engine.prg`) con todos los tipos de hallazgo y comparación de texto sin mayúsculas ni acentos. | RF-65, RF-66 | PT116, PT117, PT119, PT121, PT57 | IA (P-160) | Pendiente |
| [x] T85 | Cargar la base de conocimiento completa de los DBF (924 enfermedades) reparando los textos partidos en una coma (`generate_knowledge_base.ps1` y `LoadKnowledgeBase.sql`). | ESP-010 §4 | PT57 | IA (P-160) | Pendiente |
| [x] T86 | Primer tratamiento de cada enfermedad (`TreatmentRepository`) como "Tratamiento sugerido" para el tratante y el internista; sin la etiqueta "Motor provisional". | RF-67 | PT118 | IA (P-160) | Pendiente |
| [x] T87 | Eliminar `ProvisionalInferenceEngine`: no habrá LLM ni RAG. | Decisión final del equipo (P-160) | `dotnet test` | IA (P-160) | Pendiente |
| [x] T103 | Copia literal del `.prg`: todas las enfermedades con al menos una coincidencia, una por nombre y en orden alfabético, sin límite. | RF-65 | PT55, PT115, PT120 | IA (P-161) | Pendiente |
| [ ] T104 | Que el Ing. Castañeda confirme el orden: alfabético, como hace el código del `.prg`, o por coincidencias, como dice su comentario. Con el orden alfabético las listas tienen de 14 a 182 candidatos. | ESP-010 §2 | PT57 | Castañeda | — |
| [x] T109 | Quitar el indicador `provisional` (backend y frontend), el texto "el motor actual es provisional" del menú de ayuda y los comentarios que mencionaban el motor provisional. | RF-67 | `dotnet test`, `tsc` | IA (P-168) | Pendiente |
