# Constitución del proyecto

Reglas que rigen todo el desarrollo de XpertDiagnostic, lo haga una persona o un asistente de IA. Una especificación, un plan o un cambio de código que contradiga estas reglas no se integra a `Develop`.

## 1. Flujo de desarrollo guiado por especificaciones (SDD)

Cada funcionalidad sigue este orden:

1. **Especificación** (`specs/especificaciones/`): qué se necesita y por qué. Incluye historias de usuario, requisitos y criterios de aceptación, sin decisiones técnicas.
2. **Casos de prueba** (`specs/especificaciones/04-pruebas-tdd.md`): escenarios Given-When-Then derivados de los criterios de aceptación, escritos **antes** de programar.
3. **Plan técnico** (`specs/planes/`): cómo se va a construir. Incluye capas, archivos, patrones y decisiones con su justificación.
4. **Tareas** (`specs/tareas/`): pasos pequeños y verificables, cada uno ligado a un requisito y a un caso de prueba.
5. **Implementación**: se programa una tarea a la vez.
6. **Auditoría humana** (`specs/auditoria/`): una persona del equipo revisa, corrige si hace falta y registra el resultado.

Si durante la implementación cambia un requisito, primero se actualiza la especificación y después el código.

## 2. Arquitectura

- **R-ARQ-01.** El código se organiza por capas en carpetas separadas:
  - backend: `Controllers/`, `Services/`, `Repositories/`, `Models/`, `Data/`;
  - frontend: `app/` y `components/` (vista), `services/` (controlador), `types/` y `lib/` (modelo e infraestructura).
- **R-ARQ-02.** Los controladores no contienen lógica de negocio ni acceden directamente a la base de datos. Delegan en servicios.
- **R-ARQ-03.** Los servicios dependen de interfaces, no de implementaciones concretas, y las dependencias se registran en `Program.cs`.
- **R-ARQ-04.** Se aplican los principios SOLID. Cada clase o módulo tiene una sola responsabilidad.
- **R-ARQ-05.** Los métodos clave documentan su contrato con `@pre`, `@post` e `@inv`. Las precondiciones del backend se verifican en tiempo de ejecución.
- **R-ARQ-06.** Los patrones de diseño se usan solo donde resuelven un problema concreto, que se documenta en `specs/planes/01-arquitectura-y-patrones.md`.
- **R-ARQ-07.** Las carpetas de código y los nombres de archivos de código se escriben en **inglés**, por ejemplo `components/home/HomeScreen.tsx` o `Repositories/UserRepository.cs`. En C#, el nombre de la clase coincide con el de su archivo. Los textos que ve el usuario siguen en español, y también la documentación de `specs/`.

## 3. Seguridad

- **R-SEG-01.** Ningún secreto se escribe en el código, en `appsettings.json` ni en archivos del repositorio. Esto incluye cadenas de conexión, claves JWT y contraseñas. En desarrollo se usan `dotnet user-secrets` y `.env.local`; en otros entornos, variables de entorno.
- **R-SEG-02.** Toda entrada del usuario se valida en el servidor, aunque también se valide en el cliente.
- **R-SEG-03.** Las contraseñas se guardan y verifican solo como hash BCrypt.
- **R-SEG-04.** Los errores se responden con el código HTTP apropiado y un mensaje genérico. El detalle técnico va al log, nunca al cliente.
- **R-SEG-05.** Los mensajes de autenticación no revelan si un ID existe.

## 4. Interfaz y accesibilidad

- **R-UI-01.** Todo campo tiene una etiqueta asociada (`<label>`), aunque sea visualmente oculta.
- **R-UI-02.** Toda acción da retroalimentación visible y anunciable: estado de carga, mensaje de error con `role="alert"` y mensaje de éxito con `role="status"`.
- **R-UI-03.** Todos los controles se pueden usar con el teclado y muestran el foco.
- **R-UI-04.** Las imágenes informativas tienen texto alternativo y las decorativas llevan `alt=""`.
- **R-UI-05.** Se aplican los principios de consistencia, retroalimentación y prevención de errores.
- **R-UI-06.** No se altera el diseño visual aprobado sin acordarlo con el equipo.

## 5. Pruebas

- **R-PRU-01.** Cada criterio de aceptación tiene al menos un caso Given-When-Then en `specs/especificaciones/04-pruebas-tdd.md`.
- **R-PRU-02.** La lógica de servicios tiene pruebas unitarias automatizadas (`backend/XpertDiagnostic.Tests`) que no dependen de la base de datos.
- **R-PRU-03.** Antes de abrir un Pull Request deben pasar `dotnet test`, `npx tsc --noEmit` y `npm run lint`.

## 6. Control de versiones

- **R-GIT-01.** `main` es la rama estable (producción) y `Develop` la rama de integración. Nadie hace push directo a ninguna de las dos.
- **R-GIT-02.** Cada cambio se hace en una rama propia (`feature/`, `fix/`, `docs/`, `refactor/`) que sale de `Develop` y vuelve a ella por Pull Request.
- **R-GIT-03.** Los commits siguen el formato `tipo(alcance): descripción`.

## 7. Uso de asistentes de IA

- **R-IA-01.** Todo prompt que produzca o modifique código o especificaciones del repositorio se registra en `specs/bitacora/bitacora-prompts.md`, con su fecha, herramienta, objetivo, resultado y archivos afectados.
- **R-IA-02.** Ningún cambio generado por IA se integra a `Develop` sin la revisión de una persona del equipo, registrada en `specs/auditoria/auditoria-humana.md`.
- **R-IA-03.** La persona que revisa es responsable del código integrado. Debe entenderlo, poder explicarlo y corregirlo si no cumple estas reglas.
- **R-IA-04.** Nunca se escriben en un prompt secretos, contraseñas reales ni datos de pacientes.
- **R-IA-05.** El asistente de IA no hace commits ni push, ni modifica `main` o `Develop`, sin una instrucción explícita del equipo.
- **R-IA-06.** Si la IA documenta algo que se reconstruyó después de programarlo (por ejemplo, una especificación escrita a partir del código existente), lo declara en el propio documento.
