# Tareas: base de datos

Scripts en `backend/XpertDiagnostic.Api/Sql/`. El orden para dejar una base al día está en la [guía de instalación](../guias/guia-instalacion.md).

Cada tarea indica el requisito o la decisión que cumple, la prueba que la verifica y si la hizo una persona o un asistente de IA. La columna **Revisión humana** remite a [auditoria-humana.md](../auditoria/auditoria-humana.md).

Leyenda: `[x]` implementada · `[ ]` pendiente.

| # | Tarea | Cumple | Prueba | Hecha por | Revisión humana |
|---|---|---|---|---|---|
| [x] T33 | Tablas clínicas en SQL Server y carga de los CSV del equipo de base de datos (`CreateClinicalTables.sql`, `SeedClinicalData.sql` generado). Falta resolver con el equipo los 4 textos con `?` y las 3 enfermedades endémicas sin registrar. | Decisión del equipo | PT47, PT48 | IA (P-34) | Pendiente |
| [x] T34 | Volver a crear `dbo.USUARIOS` en el nuevo esquema (`CreateUsersTable.sql`, reemplazado en P-38 por `CreateDoctorsAndUsersTables.sql`) y recuperar sus 2 usuarios del respaldo (P-37). Respaldo del esquema anterior: `XpertDiagnostic_antes_de_tablas_clinicas_2026-11-16.bak`. | Decisión de Lucía (P-36) | PT01 | IA (P-37) | Pendiente |
| [x] T95 | Tablas `IO_` nuevas del esquema (antecedentes, complicaciones y resultados esperados), sus datos y las columnas nuevas de `IO_AntecParaClinicPacientes`. | Decisión del equipo | PT47 | Equipo (P-145, P-146, P-149) | — |
| [x] T96 | Quitar la enfermedad preexistente de `PACIENTES` (`DropPreexistingDiseaseColumn.sql`), quitando primero la llave foránea. | Decisión del equipo (P-144) | — | Equipo e IA (P-144) | — |
| [x] T97 | Renombrar columnas de ID al formato `Id_Xxx` (`RenameIdColumns.sql`). Para correrlo hay que quitar antes las dos restricciones `CHECK` de `USUARIOS` que usan dos columnas; `CreateDoctorsAndUsersTables.sql` las vuelve a crear. | Decisión del equipo | `dotnet test` | Equipo (commit 9a4194a) | — |
| [x] T99 | Quitar la columna de bienvenida de `USUARIOS` (`DropWelcomeColumn.sql`): primero su restricción por defecto, después la columna. | Decisión de Lucía (P-154) | — | IA (P-154) | Pendiente |
| [ ] T101 | Correr `AddDiagnosisValidation.sql`, `DropWelcomeColumn.sql` y `LoadKnowledgeBase.sql` (después de `SeedClinicalData.sql`) en la base de cada integrante. | — | PT47, PT57 | Equipo | — |

La validación del internista (`AddDiagnosisValidation.sql`) es la tarea T73 de [validacion-internista.md](validacion-internista.md), y la base de conocimiento (`LoadKnowledgeBase.sql`) es T85 de [maquina-de-inferencia.md](maquina-de-inferencia.md).
