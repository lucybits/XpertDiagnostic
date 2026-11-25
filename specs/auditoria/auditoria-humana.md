# Auditoría y corrección humana

Evidencia de que una persona del equipo revisó, entendió y, cuando hizo falta, corrigió lo que produjo un asistente de IA (reglas R-IA-02 y R-IA-03). Cada auditoría remite a su prompt en la [bitácora](../bitacora/bitacora-prompts.md) y a su tarea en [tareas](../tareas/inicio-sesion.md).

## Procedimiento de auditoría

1. Leer el prompt y el resultado en la bitácora.
2. Revisar el diff de cada archivo afectado (`git diff`, o la pestaña **Files changed** del Pull Request).
3. Recorrer la lista de verificación de abajo.
4. Ejecutar las verificaciones automáticas y los casos de prueba manuales que correspondan.
5. Si algo no cumple, corregirlo. La corrección la hace la persona o la IA con un nuevo prompt, que también se registra en la bitácora.
6. Registrar la auditoría en este archivo con el resultado, la evidencia (commit, PR o diff) y el nombre de quien revisó.

### Lista de verificación

- [ ] Entiendo qué hace el código y podría explicarlo sin ayuda.
- [ ] Cumple la especificación y los criterios de aceptación indicados en la tarea.
- [ ] Respeta las capas: el controlador no tiene lógica y los servicios dependen de interfaces (R-ARQ).
- [ ] Los contratos `@pre`, `@post` e `@inv` son ciertos para el código.
- [ ] No hay secretos, contraseñas ni datos reales en el código ni en los comentarios (R-SEG-01).
- [ ] Los errores no exponen detalles internos (R-SEG-04).
- [ ] La interfaz conserva el diseño aprobado y cumple R-UI.
- [ ] Pasan `dotnet test`, `npx tsc --noEmit` y `npm run lint`.
- [ ] Los casos manuales relacionados pasan.
- [ ] No hay código sin uso, duplicado ni generado "por si acaso".

---

## Registro de auditorías

### A-01. Nombre de la rama base

| Campo | Valor |
|---|---|
| Fecha | 2026-11-16 |
| Revisó | Lucía |
| Prompt | P-02 |
| Archivo | `specs/guias/guia-instalacion.md` |
| Resultado | **Corregido** |

**Hallazgo.** La guía de instalación indicaba que la rama base se llamaba `database`, en los comandos `git clone --branch database`, `git switch database`, etc. El nombre real es `Develop`. Seguir la guía habría llevado a clonar o actualizar una rama equivocada.

**Corrección.** Se pidió a la IA reemplazar todas las referencias a la rama. Se verificó que `dotnet ef database update` no se alterara, porque es un comando de Entity Framework y no el nombre de la rama.

### A-02. Modelo de ramas `main` / `Develop`

| Campo | Valor |
|---|---|
| Fecha | 2026-11-16 |
| Revisó | Lucía |
| Prompt | P-03 |
| Archivo | `specs/guias/guia-instalacion.md`, `specs/reglas/constitucion.md` (R-GIT-01) |
| Resultado | **Corregido** (decisión humana) |

**Hallazgo.** Al revisar la corrección de A-01, la IA señaló que la guía describía `Develop` como rama "base/producción". Eso era ambiguo: no indicaba qué rama era la estable.

**Corrección.** El equipo decidió que `main` es la rama estable (producción) y `Develop` la de integración. La IA documentó la decisión; la decisión fue humana.

### A-03. Capturas de pantalla en la documentación

| Campo | Valor |
|---|---|
| Fecha | 2026-11-16 |
| Revisó | Lucía |
| Prompt | P-04 (generó el contenido) y P-05 (corrección) |
| Archivo | `specs/especificaciones/04-pruebas-tdd.md`, `specs/guias/guia-instalacion.md` |
| Resultado | **Corregido** |

**Hallazgo.** La documentación generada incluía 26 marcadores del tipo "Pega aquí la captura…", y el procedimiento TDD exigía capturas como evidencia. El equipo no quería ese contenido en la documentación.

**Corrección.** Se eliminaron los marcadores. El paso 4 del procedimiento TDD ahora es "Registrar el resultado" en la tabla de ejecución.

### A-04. Comentario de documentación de `AuthService`

| Campo | Valor |
|---|---|
| Fecha | 2026-11-16 |
| Revisó | Lucía |
| Prompt | P-04 |
| Archivo | `backend/XpertDiagnostic.Api/Services/AuthService.cs` |
| Resultado | **Corregido** (edición manual) |

**Hallazgo y corrección.** La revisora editó a mano el comentario de la clase generado por la IA:

- quitó las etiquetas XML `<summary>` y `</summary>`, y `<remarks>` y `</remarks>`;
- separó el texto en dos bloques de comentarios `///`.

El código de la clase no cambió.

Antes (generado por la IA):

```csharp
/// <summary>
/// Patrón Fachada (GoF, estructural). Coordina los subsistemas que participan en el
/// inicio de sesión (repositorio de usuarios, verificador de contraseñas y emisor de tokens)
/// y ofrece al controlador una sola operación: <see cref="LoginAsync"/>.
/// </summary>
/// <remarks>
/// SOLID: cada subsistema tiene una sola responsabilidad (S) y la fachada depende solo de
/// sus interfaces (D), así que se pueden sustituir (L) sin modificar esta clase (O).
/// @inv Las tres dependencias no son null durante toda la vida del objeto.
/// </remarks>
```

Después (corrección humana):

```csharp
/// Patrón Fachada (GoF, estructural). Coordina los subsistemas que participan en el
/// inicio de sesión (repositorio de usuarios, verificador de contraseñas y emisor de tokens)
/// y ofrece al controlador una sola operación: <see cref="LoginAsync"/>.

/// SOLID: cada subsistema tiene una sola responsabilidad (S) y la fachada depende solo de
/// sus interfaces (D), así que se pueden sustituir (L) sin modificar esta clase (O).
/// @inv Las tres dependencias no son null durante toda la vida del objeto.
```

**Motivo de la corrección:** _(completar por la revisora)_.

**Nota técnica.** Sin las etiquetas XML, Visual Studio y VS Code dejan de mostrar este texto como ayuda emergente de la clase. Si más adelante se activa `GenerateDocumentationFile`, el compilador emitirá advertencias por comentarios `///` mal formados. Si se buscaba quitar el formato XML, la alternativa equivalente sin advertencias es usar comentarios `//`.

### A-05. Indicador de carga de la transición

| Campo | Valor |
|---|---|
| Fecha | 2026-11-16 |
| Revisó | Lucía |
| Prompt | P-08 |
| Archivo | `frontend/components/ui/LoadingOverlay.tsx` |
| Resultado | **Corregido** |

**Hallazgo.** El prompt pedía "el spinner svg del loading" y la IA creó un spinner SVG nuevo (`Spinner.tsx`). Lo que se quería era la animación existente `public/loading-dots.json`, la misma del botón "Entrar", para mantener la consistencia visual.

**Corrección.** Se reemplazó el spinner por `LoadingDots`, que ahora acepta un tamaño y una etiqueta opcional. `Spinner.tsx` se eliminó.

### A-06. Nombre de ejemplo en la barra superior

| Campo | Valor |
|---|---|
| Fecha | 2026-11-16 |
| Revisó | Lucía |
| Prompt | P-13 |
| Archivo | `frontend/components/home/currentDoctor.ts` |
| Resultado | **Corregido** |

**Hallazgo.** La IA inventó un médico de ejemplo ("Dr. Juan Pérez", "Medicina interna") para el saludo y el menú de cuenta. Mientras no haya datos reales, el equipo prefiere un indicador explícito y no un nombre que parezca real.

**Corrección.** Se usan los indicadores `{nombre}` y `{especialidad}`. El avatar muestra un ícono de persona cuando el nombre no tiene iniciales.

### A-07. Color de fondo de la barra lateral

| Campo | Valor |
|---|---|
| Fecha | 2026-11-16 |
| Revisó | Lucía |
| Prompt | P-20 |
| Archivo | `frontend/components/home/Sidebar.tsx` |
| Resultado | **Corregido** (edición manual) |

**Hallazgo.** La IA eligió `bg-sky-900` como "azul cielo oscuro". La revisora consideró que `bg-blue-900` se ve mejor y lo cambió a mano.

**Corrección.** Se cambió `bg-sky-900` por `bg-blue-900`. En la misma edición se perdió el color del borde derecho, que la IA restauró como `border-blue-950` en P-21.

### A-08. Fondo negro en la barra lateral

| Campo | Valor |
|---|---|
| Fecha | 2026-11-16 |
| Revisó | Lucía |
| Prompt | P-22 |
| Archivo | `frontend/components/home/Sidebar.tsx` |
| Resultado | **Corregido** (edición manual) |

**Hallazgo.** La revisora prefirió un fondo negro en lugar del azul `bg-blue-900` y detectó que la barra de desplazamiento del navegador se veía anticuada sobre el fondo oscuro.

**Corrección.** Cambió a mano el fondo a `bg-black/90`. La IA adaptó la paleta y la barra de desplazamiento en P-23.

### A-09. Pérdida de rendimiento por el fondo aurora

| Campo | Valor |
|---|---|
| Fecha | 2026-11-16 |
| Revisó | Lucía |
| Prompt | P-28 (introdujo el problema) y P-29 (corrección) |
| Archivo | `frontend/components/ui/AuroraBackground.tsx` |
| Resultado | **Corregido** |

**Hallazgo.** Al probar la pantalla, la revisora notó tirones fuertes al contraer y expandir la barra lateral. La IA no lo detectó al crear el fondo, porque solo verificó capturas estáticas. El desenfoque SVG se recalculaba en cada fotograma de la animación de ancho.

**Corrección.** El fondo pasa a ser fijo al tamaño de la ventana, en su propia capa y sin modo de mezcla (P-29). **Lección:** al agregar efectos costosos (filtros, desenfoques, mezclas), hay que probarlos junto con las animaciones de la pantalla y no solo con capturas estáticas.

### A-10. Fondo aurora descartado

| Campo | Valor |
|---|---|
| Fecha | 2026-11-16 |
| Revisó | Lucía |
| Prompt | P-28, P-29 y P-30 |
| Archivo | `frontend/components/ui/AuroraBackground.tsx` (eliminado) |
| Resultado | **Rechazado** |

**Hallazgo.** Después de la optimización de P-29, la revisora siguió notando tirones al contraer y expandir la barra lateral.

**Corrección.** Se decidió eliminar el fondo decorativo y priorizar la fluidez de la interfaz sobre el efecto visual.

---

### A-11. Columnas agregadas a PACIENTES

| Campo | Valor |
|---|---|
| Fecha | 2026-11-16 |
| Revisó | Lucía |
| Prompt | P-34 |
| Archivo | `backend/XpertDiagnostic.Api/Sql/CreateClinicalTables.sql` |
| Resultado | **Corregido** |

**Hallazgo.** La IA agregó a `PACIENTES` las columnas `Sexo` y `FechaUltimaConsulta`, que no vienen en los CSV del equipo de base de datos, para que funcionaran los filtros del buscador.

**Corrección.** Se quitaron. La tabla conserva solo las columnas que vienen en los datos entregados (P-35).

---

## Pendientes de auditoría (T24)

Archivos producidos o modificados por la IA en P-04 y P-07 que todavía no tienen una revisión humana registrada. Al revisar cada uno, marca la casilla, completa la fecha y el nombre, y si hubo correcciones agrega una entrada `A-XX` arriba.

### Backend

| Revisado | Archivo | Fecha | Revisó | Resultado |
|---|---|---|---|---|
| [ ] | `Controllers/AuthController.cs` | | | |
| [ ] | `Controllers/HealthController.cs` | | | |
| [ ] | `Configuration/JwtOptions.cs` | | | |
| [ ] | `Middleware/GlobalExceptionHandler.cs` | | | |
| [ ] | `Models/DTOs/*`, `Models/Entities/User.cs`, `Models/Results/*` | | | |
| [ ] | `Repositories/IUserRepository.cs`, `Repositories/UserRepository.cs` | | | |
| [x] | `Services/AuthService.cs` | 2026-11-16 | Lucía | Corregido (A-04); la lógica falta revisarla |
| [ ] | `Services/PasswordCredentialVerifier.cs` | | | |
| [ ] | `Services/JwtTokenService.cs` | | | |
| [ ] | `Services/DatabaseHealthService.cs` | | | |
| [ ] | `Services/Interfaces/*` | | | |
| [ ] | `Program.cs`, `appsettings.json`, `appsettings.Development.json`, `XpertDiagnostic.Api.http` | | | |
| [ ] | `XpertDiagnostic.Tests/*` y `XpertDiagnostic.sln` | | | |

### Frontend

| Revisado | Archivo | Fecha | Revisó | Resultado |
|---|---|---|---|---|
| [ ] | `app/(auth)/login/page.tsx` | | | |
| [ ] | `components/auth/LoginForm.tsx` | | | |
| [ ] | `app/api/login/route.ts` | | | |
| [ ] | `app/api/test-db/route.ts` | | | |
| [ ] | `lib/db.ts` | | | |
| [ ] | `lib/loginState.ts` | | | |
| [ ] | `lib/loginValidation.ts`, `lib/apiClient.ts` | | | |
| [ ] | `services/authService.ts`, `types/auth.ts` | | | |
| [ ] | `.env.example` | | | |

### Especificaciones

| Revisado | Archivo | Fecha | Revisó | Resultado |
|---|---|---|---|---|
| [ ] | `specs/reglas/constitucion.md` | | | |
| [ ] | `specs/especificaciones/03-inicio-sesion.md` | | | |
| [ ] | `specs/especificaciones/04-pruebas-tdd.md` | | | |
| [ ] | `specs/planes/01-arquitectura-y-patrones.md` | | | |
| [ ] | `specs/planes/02-plan-inicio-sesion.md` | | | |
| [ ] | `specs/tareas/inicio-sesion.md` | | | |
| [ ] | `specs/guias/guia-instalacion.md` | | | |

---

## Verificaciones automáticas ejecutadas por la IA

Estas verificaciones las ejecutó el asistente de IA. Son evidencia complementaria y **no sustituyen** la revisión humana.

| Fecha | Prompt | Verificación | Resultado |
|---|---|---|---|
| 2026-11-16 | P-04 | `dotnet test --filter "Categoria!=Integracion"` | 17 correctas, 0 con error |
| 2026-11-16 | P-04 | `npx tsc --noEmit` | Sin errores |
| 2026-11-16 | P-04 | `npx eslint app components lib services types` | Sin errores, después de corregir dos `set-state-in-effect` que ya existían |
| 2026-11-16 | P-04 | API nueva en el puerto 5199 contra SQL Server local | Datos inválidos → 400; JSON mal formado → 400; contraseña incorrecta → 401; `/api/health/db` → conectado |
| 2026-11-16 | P-04 | `POST /api/login` en Next.js (puerto 3000) | Datos inválidos → 400; contraseña incorrecta → 401; `/login` responde 200 con las etiquetas nuevas |
| — | — | Inicio de sesión exitoso (PT01) | **No ejecutado:** requiere credenciales reales, a cargo del equipo |

### A-14. Etiqueta "Cédula profesional" revertida

| Campo | Valor |
|---|---|
| Fecha | 2026-11-17 |
| Revisó | Lucía |
| Prompt | P-74 |
| Archivo | `frontend/components/auth/LoginForm.tsx` |
| Resultado | **Rechazado** |

**Hallazgo.** Lucía prefirió no usar "Cédula profesional", porque el login usa el ID médico y no la cédula.

**Corrección.** La etiqueta y el texto de ayuda volvieron a "ID médico".

---

### A-17. El alta aceptaba "111" como nombre del paciente

| Campo | Valor |
|---|---|
| Fecha | 2026-11-17 |
| Revisó | Lucía |
| Prompt | P-99 |
| Archivo | `frontend/lib/newPatient.ts` |
| Resultado | **Corregido** |

**Hallazgo.** Al probar la ventana "Nuevo paciente", la revisora registró "111" como nombre y el sistema lo aceptó. La validación solo revisaba la longitud.

**Corrección (P-100).** El nombre debe tener al menos una letra y no admite números. Se agregó el caso PT37.

---

### A-18. Nombre del paciente cortado en el lomo y sexto ícono oculto

| Campo | Valor |
|---|---|
| Fecha | 2026-11-17 |
| Revisó | Lucía |
| Prompt | P-75, P-99 |
| Archivo | `frontend/components/home/PatientRecordPanel.tsx` |
| Resultado | **Corregido** |

**Hallazgo.** En el expediente plegado, el nombre del paciente se cortaba. En ventanas bajas solo se veían 5 de los 6 íconos de hallazgos.

**Corrección (P-100).** El lomo ya no muestra el nombre. Los íconos no se encogen; lo que se adapta al alto es la barra de avance.

---

### A-19. Paciente de la sesión dentro del encabezado: descartado

| Campo | Valor |
|---|---|
| Fecha | 2026-11-17 |
| Revisó | Lucía |
| Prompt | P-101 |
| Archivo | `frontend/components/assistant/SectionHeader.tsx` |
| Resultado | **Rechazado** |

**Hallazgo.** La IA colocó el paciente de la sesión como etiqueta dentro del encabezado de la sección. La revisora lo quería fuera de esa barra.

**Corrección.** Se le dieron tres opciones y eligió una píldora flotante en el área del chat. Después pidió más contraste y quedó en azul marino con texto blanco.

---

### A-20. Interfaz de salida bloqueada por un diálogo oculto

| Campo | Valor |
|---|---|
| Fecha | 2026-11-18 |
| Revisó | Lucía |
| Prompt | P-105 |
| Archivo | `frontend/components/home/PatientSearchDialog.tsx` |
| Resultado | **Corregido** |

**Hallazgo.** Al entrar a la interfaz de salida con "Ver resultado" desde el buscador, ningún control respondía. La IA solo había probado abriendo la página directamente, así que no detectó que el diálogo modal seguía abierto en la pantalla oculta de `/home`.

**Corrección (P-107).** El enlace cierra el buscador, y los diálogos se cierran al desmontarse u ocultarse. Se verificó el mismo camino con clics reales.

---

### A-21. Acceso ambiguo a la interfaz de salida

| Campo | Valor |
|---|---|
| Fecha | 2026-11-18 |
| Revisó | Lucía |
| Prompt | P-110 |
| Archivo | `frontend/components/home/PatientRecordPanel.tsx` |
| Resultado | **Corregido** |

**Hallazgo.** La IA puso "Ver resultado del expediente" para cualquier paciente seleccionado. La revisora señaló que era ambiguo: permitía ver un "resultado" sin haber analizado ni confirmado un diagnóstico, lo que contradice el flujo de entrada a salida.

**Corrección (P-111).** El botón aparece solo con un diagnóstico confirmado, junto al nombre de la enfermedad. Antes se muestra una guía con el paso que falta.

---

### A-22. Patrón Strategy sin respaldo en el plan

| Campo | Valor |
|---|---|
| Fecha | 2026-11-22 |
| Revisó | Lucía |
| Prompt | P-103 |
| Archivo | `specs/bitacora/bitacora-prompts.md` |
| Resultado | **Corregido** |

**Hallazgo.** En P-103 la IA describió el motor de inferencia como patrón Strategy y citó una sección 4.4 del plan 01 que no existe. El proyecto solo documenta tres patrones: Singleton, Fachada y Estado.

**Corrección (P-122).** Se quitó la mención a Strategy. El proyecto se queda con Estado, Fachada y Singleton.

---

### A-23. El expediente conserva sus colores y banners

| Campo | Valor |
|---|---|
| Fecha | 2026-11-22 |
| Revisó | Lucía |
| Prompt | P-126 |
| Archivo | `frontend/components/home/PatientRecordPanel.tsx` |
| Resultado | **Revertido** |

**Hallazgo.** Al quitar estilos "hechos por IA", la IA también quitó del expediente los banners que se desenfocan y enfocan al pasar el cursor, y los colores de cada tipo de hallazgo, incluidos los íconos del lomo minimizado. Lucía los considera parte del diseño y no un estilo genérico.

**Corrección.** El expediente vuelve a su versión anterior a P-126. Los demás cambios de P-126 se mantienen.

---

### A-24. No se veía qué diagnóstico estaba confirmado

| Campo | Valor |
|---|---|
| Fecha | 2026-11-22 |
| Revisó | Lucía |
| Prompt | P-105, P-111 |
| Archivo | `frontend/components/assistant/DiagnosisPanel.tsx` |
| Resultado | **Corregido** |

**Hallazgo.** Después de confirmar un diagnóstico y volver a la pantalla de diagnóstico diferencial, todos los candidatos seguían con "Confirmar este diagnóstico". No se veía cuál estaba confirmado ni que ya estaba guardado en el expediente.

**Corrección (P-135).** Un aviso arriba de la lista dice qué diagnóstico está confirmado y guardado, con acceso al resultado. El candidato confirmado lleva la etiqueta "Confirmado" y los demás ofrecen "Cambiar a este diagnóstico".

---

### A-25. "Guardar y continuar" no avanzaba con todo completo

| Campo | Valor |
|---|---|
| Fecha | 2026-11-22 |
| Revisó | Lucía |
| Prompt | P-103 |
| Archivo | `frontend/components/home/HomeScreen.tsx` |
| Resultado | **Corregido** |

**Hallazgo.** Al revisar una sección ya completa y pulsar "Guardar y continuar" sin cambios, la pantalla no avanzaba. La IA solo había contemplado el avance hacia secciones pendientes. Además, guardar sin cambios desactualizaba el análisis.

**Corrección (P-136).** Si no quedan secciones pendientes, se pasa a la siguiente en orden. El análisis solo se desactualiza si lo guardado cambió.

---

### A-26. Diagnóstico diferencial vacío tras quitar texto

| Campo | Valor |
|---|---|
| Fecha | 2026-11-22 |
| Revisó | Lucía |
| Prompt | P-127 |
| Archivo | `frontend/components/assistant/DiagnosisPanel.tsx` |
| Resultado | **Corregido** |

**Hallazgo.** Al reducir textos, la IA quitó la única indicación de la tarjeta antes del primer análisis. Con un paciente nuevo, la tarjeta se veía vacía y parecía que el sistema no daba resultados.

**Corrección (P-137).** Una línea indica pulsar "Analizar expediente". Lección: al recortar texto, conservar lo que dice qué hacer cuando una pantalla todavía no tiene contenido.

---

### A-27. Panel de administrador con aspecto genérico de IA

| Campo | Valor |
|---|---|
| Fecha | 2026-11-22 |
| Revisó | Lucía |
| Prompt | P-140 |
| Archivo | `frontend/components/admin/AdminPanel.tsx` |
| Resultado | **Corregido** |

**Hallazgo.** La primera versión del panel usaba los patrones típicos de una interfaz generada por IA: tabla dentro de una tarjeta redondeada, estado en píldora, tres botones con borde e ícono por fila, subtítulo explicativo y botón principal con ícono.

**Corrección (P-140).** Tabla de datos sobria con líneas horizontales, estado y acciones como texto, conteo junto al título. Lección: en vistas administrativas, preferir convenciones de tabla clásicas a componentes decorados.

---

### A-28. "Confirmado por el médico internista" sin que un internista lo confirmara

| Campo | Valor |
|---|---|
| Fecha | 2026-11-24 |
| Revisó | Lucía |
| Prompt | P-151 |
| Archivo | `backend/XpertDiagnostic.Api/Configuration/ValidationStates.cs` |
| Resultado | **Corregido** |

**Hallazgo.** Al probar con el tratante, PACIE00002 (paciente del seed con Tirotoxicosis ya guardada) decía "Tirotoxicosis: confirmado por el médico internista", pero en la pantalla del internista no aparecía ni en Pendientes ni en Confirmados. La IA había decidido que un diagnóstico guardado antes de la validación contara como confirmado. El sistema afirmaba una validación que nunca ocurrió.

**Corrección (P-152).** El estado es solo el guardado: un diagnóstico sin pasar por el internista queda "sin enviar". El panel del expediente dice "Diagnóstico registrado, sin validar por el médico internista" y la interfaz de salida "Registrado sin validación del médico internista". Lección: en un sistema clínico, nunca inferir que una persona validó algo; solo mostrarlo si quedó registrado.

---