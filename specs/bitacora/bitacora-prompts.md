Reescribí únicamente los campos **Prompt** (y los mensajes enviados durante la tarea), con más contexto, más detalle de lo que querías y de lo que no querías que se tocara, pero conservando el tono de alguien que va aprendiendo: sin tecnicismos, señalando cosas, dudando, preguntando si se puede. Todo lo demás de la bitácora quedó igual, incluidos resultados, archivos y verificaciones.

---

# Bitácora de prompts

Registro cronológico de los prompts dirigidos a asistentes de IA que produjeron o modificaron código o especificaciones del repositorio (regla R-IA-01). Cada entrada indica qué se pidió, qué hizo la IA y cómo se revisó.

## Cómo registrar una entrada

Copia la plantilla al final del archivo y completa todos los campos. El prompt se escribe **textual**, sin resumirlo. Si contenía datos sensibles, reemplázalos por `<omitido>` y no los registres.

```markdown
### P-XX. Título breve

| Campo | Valor |
|---|---|
| Fecha | AAAA-MM-DD |
| Autor del prompt | Nombre del integrante |
| Herramienta / modelo | p. ej. Claude Code (extensión VS Code), Claude Opus 5.5 |
| Objetivo | Qué se buscaba |
| Especificación / tarea | ESP-XXX, TXX |

**Prompt**

> Texto del prompt.

**Resultado de la IA:** qué produjo o cambió.

**Archivos afectados:** lista.

**Verificación automática:** pruebas, lint o compilación ejecutados y su resultado.

**Revisión humana:** Pendiente / Aceptado / Corregido (ver A-XX en auditoria-humana.md).
```

---

## Sesión 1: 2026-11-16

Herramienta para todas las entradas de esta sesión: **Claude Code** (extensión de VS Code), modelo **Claude Opus 5.5** (`claude-opus-5-5`).

### P-01. Revisión del estado del proyecto

| Campo | Valor |
|---|---|
| Fecha | 2026-11-16 |
| Autor del prompt | Lucía |
| Objetivo | Conocer qué está implementado antes de planear cambios |
| Especificación / tarea | — |

**Prompt**

> Antes de empezar a moverle cosas al proyecto necesito saber bien en qué estado está, porque entré hace poco al equipo y no tengo claro qué ya está hecho y qué no. ¿Podrías revisar el proyecto tal como está ahorita y decirme lo que hay actualmente, un resumen? Me interesa el backend, el frontend, lo del servicio de IA y también la documentación.
>
> No cambies nada todavía, es solo para ubicarme. Y si ves cosas raras, a medias o pendientes, dímelas también, porque necesito saber dónde estamos parados antes de planear.

**Resultado de la IA:** inventario del backend, el frontend, el servicio de IA y la documentación. Señaló pendientes:

- repositorios vacíos;
- JWT generado pero no validado;
- proyecto de pruebas fuera de la solución;
- `requirements.txt` en UTF-16;
- guía de instalación desactualizada.

**Archivos afectados:** ninguno (solo lectura).

**Revisión humana:** Aceptado. Sirvió de base para los prompts siguientes.

### P-02. Corregir el nombre de la rama base

| Campo | Valor |
|---|---|
| Fecha | 2026-11-16 |
| Autor del prompt | Lucía |
| Objetivo | Corregir la documentación, que llamaba `database` a la rama base |
| Especificación / tarea | — |

**Prompt**

> Oye, en la documentación se está llamando `database` a la rama base en un montón de partes, y en realidad la rama se llama Develop. Cambia todo lo de database y sus referencias a esta rama a Develop, porfa, porque así se llama de verdad y si no la gente se confunde al seguir la guía.
>
> Solo eso, el nombre de la rama. No me vayas a cambiar otras cosas del archivo.

**Resultado de la IA:** reemplazó 13 referencias a la rama en la guía de instalación. Dejó intacto `dotnet ef database update`, que es un comando de Entity Framework y no la rama. Advirtió que la guía describía `Develop` como "base/producción".

**Archivos afectados:** `specs/guias/guia-instalacion.md` (entonces `docs/03-guia-instalacion.md`).

**Revisión humana:** Corregido por el equipo; la corrección originó este prompt. Ver A-01.

### P-03. Definir el modelo de ramas

| Campo | Valor |
|---|---|
| Fecha | 2026-11-16 |
| Autor del prompt | Lucía |
| Objetivo | Aclarar el papel de `main` y `Develop` |
| Especificación / tarea | R-GIT-01 |

**Prompt**

> Ya que estamos con lo de las ramas, quiero que quede escrito cómo lo vamos a manejar para que nadie se equivoque después. La rama main la estableceremos como la estable, o sea producción, y nadie le mete mano directo. Todos los cambios van a Develop, que es la de integración, y de ahí se pasa cuando ya está probado.
>
> Ponlo en la parte de ramas de la guía, y agrega también la regla de que no se abren Pull Requests de una rama de trabajo directo a main.

**Resultado de la IA:** documentó las dos ramas en la sección 9 de la guía y agregó la regla de no abrir Pull Requests de una rama de trabajo hacia `main`.

**Archivos afectados:** `specs/guias/guia-instalacion.md`.

**Revisión humana:** Aceptado. La decisión fue del equipo. Ver A-02.

### P-04. Arquitectura, TDD, SOLID, contratos, patrones GoF, seguridad y accesibilidad

| Campo | Valor |
|---|---|
| Fecha | 2026-11-16 |
| Autor del prompt | Lucía |
| Objetivo | Cumplir los requisitos de la unidad sin alterar el diseño visual |
| Especificación / tarea | ESP-001, T03–T21 |

**Prompt**

> A partir de lo que ya está actualmente, y con los patrones de diseño GoF, se requiere todo esto:
>
> o Arquitectura MVC o multicapa, con Modelo, Vista y Controlador separados en carpetas.
> o TDD manual: casos Given-When-Then escritos antes de programar y capturas de su ejecución manual.
> o SOLID y contratos: principios SOLID aplicados y precondiciones (@pre), postcondiciones (@post) e invariantes (@inv) en métodos clave.
>
> Se requiere seguir todo esto en la estructura de proyectos actual, así como tener en cuenta:
> 3 patrones de diseño de los vistos en la unidad (creacionales, estructurales o de comportamiento) implementados en el código, explicando el problema del proyecto que resuelve cada uno.
>
> Ojo, el proyecto ya usa nombres descriptivos y separa las responsabilidades entre los controladores, los servicios y las interfaces. El inicio de sesión valida los datos que se reciben en el servidor, también verifica las credenciales y maneja los errores con respuestas HTTP que son apropiadas, las contraseñas se verifican mediante hash, las claves y cadenas de conexión deben configurarse por fuera del código, mediante una configuración segura.
>
> En la interfaz de inicio de sesión se incluyen etiquetas y mensajes de error, se incluyen estados de carga y controles accesibles por teclado, también se usan los atributos ARIA, y texto alternativo para imágenes formativas. Estos elementos aplican principios básicos de consistencia, retroalimentación y prevención.
>
> Nosotros escogimos estos tres, así que se requiere que se apliquen correctamente y con buenas prácticas de código, pero sin alterar nuestro diseño actual:
>
> 1. Singleton: patrón creacional
> Problema que se resuelve: crear una conexión nueva a SQL Server cada vez que se necesita podría generar conexiones repetidas y desperdiciar recursos.
> Implementación: por ejemplo, en `frontend/lib/db.ts`, `getConnection()` guarda la conexión en la variable `pool`. Si ya existe, la devuelve; si no, establece la conexión y la conserva para reutilizarla. Esto evita abrir una conexión nueva en cada llamada dentro de ese módulo.
>
> 2. Fachada: patrón estructural
> Problema que se resuelve: el proceso de autenticación requiere varios pasos, entre ellos buscar al usuario, verificar su contraseña y generar un token. Si el controlador tuviera que realizar todo directamente, acumularía lógica y conocería detalles de cada operación.
> Implementación: por ejemplo, `AuthController` recibe la solicitud y delega la lógica en `IAuthService`. `AuthService` coordina las operaciones necesarias para autenticar al usuario y devuelve el resultado. De esta manera, el controlador ofrece un acceso sencillo al proceso.
>
> 3. Estado: patrón de comportamiento
> Problema que se resuelve: durante el inicio de sesión, la interfaz debe responder a distintos momentos: captura de datos, espera de respuesta y presentación del resultado. Sin controlar esos cambios, no podría dar retroalimentación adecuada al usuario.
> Implementación: por ejemplo, la página de inicio de sesión usa `useState` para guardar los campos, el indicador de carga y los mensajes de error o éxito. Cuando esos valores cambian, React actualiza la interfaz correspondiente.
>
> Alcance: Fachada y Estado se observan en el flujo de inicio de sesión; Singleton, en la conexión a SQL Server. Por eso es más preciso describirlos como patrones aplicados en esas partes del proyecto, y no en todos sus módulos.

**Resultado de la IA:**

- Backend:
  - repositorio, interfaces y fachada `AuthService`;
  - `JwtOptions` validadas al arrancar;
  - validación del modelo con 400;
  - `GlobalExceptionHandler`;
  - validación de JWT;
  - CORS desde la configuración;
  - contratos `@pre`, `@post` e `@inv`;
  - 17 pruebas unitarias.
- Frontend:
  - Singleton corregido, con la promesa compartida y guardado en `globalThis`;
  - patrón Estado con clases;
  - `LoginForm` extraído con las mismas clases CSS;
  - etiquetas ocultas y ARIA;
  - cookie `httpOnly`;
  - servicio y cliente HTTP.
- Documentación: casos PT01–PT16 y documento de arquitectura y patrones; guía actualizada.

La IA señaló dos cosas:

- usar `useState` por sí solo no constituye el patrón Estado de GoF;
- los casos Given-When-Then se redactaron después de este cambio, no antes.

**Archivos afectados:** ver tareas T03–T21 en `specs/tareas/inicio-sesion.md`.

**Verificación automática:**

- `dotnet test`: 17/17 correctas.
- `npx tsc --noEmit` y `eslint`: sin errores.
- Prueba de humo contra SQL Server real:
  - API: 400 con datos inválidos, 401 con contraseña incorrecta y `/api/health/db` conectado;
  - Next.js: `/api/login` responde 400 y 401.

**Revisión humana:** Parcial. `AuthService.cs` fue corregido por el equipo (A-04); el resto está pendiente de auditoría (T24).

### P-05. Quitar las referencias a capturas de pantalla

| Campo | Valor |
|---|---|
| Fecha | 2026-11-16 |
| Autor del prompt | Lucía |
| Objetivo | Eliminar de la documentación las indicaciones de pegar capturas |
| Especificación / tarea | T20 |

**Prompt**

> En la documentación hay un montón de partes donde dice que hay que pegar capturas de pantalla, y la verdad no las vamos a estar pegando. Elimina todo lo referente a "pegar capturas de pantalla" en la documentación, tanto en la guía como en lo de las pruebas TDD.
>
> Donde se pida captura, deja otra cosa que sí podamos cumplir, tipo registrar el resultado en la tabla o algo así, pero sin capturas.

**Resultado de la IA:** eliminó 26 marcadores, 10 de la guía y 16 de las pruebas TDD. El paso 4 del procedimiento TDD pasó a ser "Registrar el resultado" en la tabla. Advirtió que el requisito original pedía capturas.

**Archivos afectados:** `specs/guias/guia-instalacion.md`, `specs/especificaciones/04-pruebas-tdd.md`.

**Revisión humana:** Corregido por el equipo; la corrección originó este prompt. Ver A-03.

### P-06. Requisito de desarrollo con IA (SDD), interrumpido

| Campo | Valor |
|---|---|
| Fecha | 2026-11-16 |
| Autor del prompt | Lucía |
| Objetivo | Incorporar los artefactos de SDD |
| Especificación / tarea | — |

**Prompt**

> Oye, hay que tener en cuenta lo siguiente ahora, es un requisito de la materia: desarrollo con IA (SDD). Necesitamos una carpeta /specs en el repositorio con reglas, especificaciones, planes y tareas; también una bitácora de prompts; y evidencia de la auditoría y corrección humana del código.
>
> ¿Cómo lo ves? Revísalo y dime cómo lo acomodamos.

**Resultado de la IA:** solo leyó `AuthService.cs` y el estado del repositorio. La usuaria interrumpió para replantear el enfoque en P-07.

**Archivos afectados:** ninguno.

**Revisión humana:** Interrumpido por la usuaria.

### P-07. Convertir `docs/` en `specs/` y completar los artefactos de SDD

| Campo | Valor |
|---|---|
| Fecha | 2026-11-16 |
| Autor del prompt | Lucía |
| Objetivo | Reutilizar la documentación existente como base de SDD |
| Especificación / tarea | T22 |

**Prompt**

> Sobre lo de SDD del mensaje anterior: ¿qué opinas si agarro lo de `docs` y nomás le cambio el nombre a `specs`? Así reusamos lo que ya hay en vez de empezar de cero, y adentro pones lo restante del requisito: reglas, especificaciones, planes, tareas, bitácora de prompts y lo de la auditoría y corrección humana del código.
>
> Acomódalo en subcarpetas para que se entienda qué es cada cosa, y actualiza los enlaces y las referencias a `docs/` que queden en el código.

**Resultado de la IA:**

- Renombró `docs/` a `specs/` y la organizó en `reglas/`, `especificaciones/`, `planes/`, `tareas/`, `guias/`, `bitacora/` y `auditoria/`.
- Creó:
  - la constitución del proyecto;
  - la especificación ESP-001 de inicio de sesión;
  - el plan técnico;
  - la lista de tareas;
  - esta bitácora;
  - el registro de auditoría humana.
- Actualizó los enlaces y las referencias a `docs/` en `Program.cs` y `AuthServiceTests.cs`.

**Archivos afectados:** toda la carpeta `specs/`, `backend/XpertDiagnostic.Api/Program.cs` (comentario) y `backend/XpertDiagnostic.Tests/AuthServiceTests.cs` (comentario).

**Revisión humana:** Pendiente (T24).

### P-08. Transición simulada a la pantalla principal

| Campo | Valor |
|---|---|
| Fecha | 2026-11-16 |
| Autor del prompt | Lucía |
| Objetivo | Simular, sin lógica de sesión, el paso del login a la pantalla principal |
| Especificación / tarea | T28 |

**Prompt**

> Cuando dice "Inicio de sesión exitoso" quiero que pase algo, pero sería solo para simular por el momento, después le colocamos su debida lógica.
>
> Que al momento de decir "Inicio de sesión exitoso" se ponga toda la pantalla con blur y algo de opacity mientras está el spinner svg del loading en medio de la pantalla, y después de un ratito que nos lleve a la pantalla principal. Esa pantalla va a estar completamente vacía, solo un pequeño texto de prueba para ver que sí llegamos ahí.
>
> O sea es solo la transición y el simulacro, no le metas sesión ni nada todavía.

**Resultado de la IA:**

- Nuevos componentes `Spinner` (SVG) y `LoadingOverlay` (después, a pedido de la usuaria, el spinner se reemplazó por la animación `loading-dots.json` y se eliminó `Spinner.tsx`):
  - capa a pantalla completa con `backdrop-blur` y fondo semitransparente;
  - se monta en `document.body` para cubrir toda la ventana.
- En `LoginForm`, al entrar al estado de éxito se muestra la capa, el formulario queda inerte y, después de 1.5 s simulados (luego ajustado a 5 s a pedido de la usuaria), se navega con `router.replace('/inicio')`.
- Nueva ruta `/inicio` con un texto de prueba.

**Archivos afectados:** `frontend/components/ui/LoadingOverlay.tsx`, `frontend/components/ui/LoadingDots.tsx`, `frontend/components/auth/LoginForm.tsx`, `frontend/app/(app)/inicio/page.tsx`.

**Verificación automática:** `npx tsc --noEmit` y `eslint` sin errores; `GET /inicio` → 200.

**Revisión humana:** Corregido: el spinner debía ser `loading-dots.json` (A-05).

### P-09. Nombres de carpetas y archivos de código en inglés

| Campo | Valor |
|---|---|
| Fecha | 2026-11-16 |
| Autor del prompt | Lucía |
| Objetivo | Establecer el inglés para carpetas y nombres de archivos de código |
| Especificación / tarea | R-ARQ-07, T29 |

**Prompt**

> Una cosa que se me olvidó decirte: durante el código hay que procurar que las carpetas de desarrollo y los nombres de archivos de código sean en inglés. Los textos que ve el usuario sí se quedan en español, pero carpetas, archivos y clases van en inglés.
>
> Pásate por lo que ya está en español y cámbialo, y deja la regla escrita para que no se nos vaya otra vez.

Entre P-08 y este prompt hubo ajustes visuales menores (animación `loading-dots.json`, capa oscura, espera de 5 s, carpeta propia para la pantalla principal y fondo blanco con texto oscuro en `text-base`). Están reflejados en P-08, T28 y A-05.

**Resultado de la IA:**

- Backend, archivos y clases renombrados:
  - `Usuario` → `User`;
  - `IUsuarioRepository` / `UsuarioRepository` → `IUserRepository` / `UserRepository`;
  - `TokenGenerado` → `GeneratedToken`;
  - `VerificacionPassword` → `PasswordVerificationResult`;
  - `EstadoBaseDatos` → `DatabaseStatus`;
  - `Sql/UpgradeUsuarioPasswordColumn.sql` → `Sql/UpgradeUserPasswordColumn.sql`.
- Frontend:
  - `app/(app)/inicio` → `app/(app)/home` (la URL cambia de `/inicio` a `/home`);
  - `components/inicio/PantallaPrincipal.tsx` → `components/home/HomeScreen.tsx`.
- Sin cambios: los textos de la interfaz, las propiedades que forman el JSON de la API y los métodos internos.
- Nueva regla R-ARQ-07 en la constitución y especificaciones actualizadas con los nombres nuevos.

**Archivos afectados:** los archivos renombrados y todas las clases que los usan (`Program.cs`, `AppDbContext.cs`, servicios, interfaces, `HealthController.cs` y pruebas), además de `LoginForm.tsx` y `specs/`.

**Verificación automática:** `dotnet test` 17/17 correctas; `tsc` y `eslint` sin errores; `GET /home` → 200.

**Revisión humana:** Pendiente.

### P-10. Barra lateral de la pantalla principal

| Campo | Valor |
|---|---|
| Fecha | 2026-11-16 |
| Autor del prompt | Lucía |
| Objetivo | Agregar a la pantalla principal una barra lateral orientada al médico, basada en un boceto |
| Especificación / tarea | T30 |

**Prompt**

> En la pantalla principal coloquemos un sidebar izquierdo, quizá como componente aparte para no llenar el archivo. Que sea lo suficientemente justo en cuanto a proporciones y tamaño, ni muy angosto ni enorme.
>
> Deberá parecerse a este boceto que te adjunto, pero no técnico, nada de tecnicidades, sino el sidebar orientado al usuario final, que es el médico. O sea que se entienda a la primera, con palabras normales de consultorio.

Se adjuntó un boceto con: logo, "Buscar Paciente", secciones `Ant_Per_Pat`, `Ant__Per_Pat`, `Alergias`, `Ant_Quirurgic_Anestes`, `Sintomas`, `Signos`, `Estudios_Lab`, `Enfermedad_Preexi` y el botón "Guardar". Las dos primeras secciones tenían fondo verde y naranja.

**Resultado de la IA:**

- Componentes nuevos:
  - `components/home/Sidebar.tsx`;
  - `components/home/clinicalSections.ts`, con las secciones y su estado de ejemplo.
- Cambios en `HomeScreen.tsx`.
- Nombres técnicos traducidos a lenguaje médico; por ejemplo, `Ant_Quirurgic_Anestes` → "Cirugías y anestesias previas".
- Verde y naranja interpretados como estado de la sección (completada / en progreso). Cada estado lleva además un ícono y un texto para lectores de pantalla.
- En pantallas pequeñas, la barra se abre con un botón de menú y se cierra con Escape o tocando fuera.

**Archivos afectados:** `frontend/components/home/Sidebar.tsx`, `frontend/components/home/clinicalSections.ts`, `frontend/components/home/HomeScreen.tsx`.

**Verificación automática:** `tsc` y `eslint` sin errores; capturas sin ventana de Edge a 1280 px y 400 px.

**Revisión humana:** Pendiente. Falta confirmar con el equipo el significado de los colores verde y naranja del boceto.

### P-11. Rediseño profesional de la barra lateral

| Campo | Valor |
|---|---|
| Fecha | 2026-11-16 |
| Autor del prompt | Lucía |
| Objetivo | Dar a la barra lateral un estilo más profesional, inspirado en una referencia de interfaz médica |
| Especificación / tarea | T30 |

**Prompt**

> Todavía no me convence cómo se ve la barra. Quiero un diseño más parecido a este, con el sidebar, pero que encaje perfecto y/o contraste con nuestra paleta de colores y la info actual, más profesional, UI medical.
>
> No copies la marca ni los contenidos de la referencia, solo la idea de cómo está organizado y el estilo: los grupos se pliegan, lo activo se ve distinto, los íconos son de línea, y hay un botón para contraer la barra.

Se adjuntó una captura de referencia de otro producto con:

- grupos plegables con título discreto;
- el elemento activo en blanco con sombra;
- íconos de línea;
- botón para contraer la barra.

No se copiaron su marca ni sus contenidos.

**Resultado de la IA:**

- Barra rediseñada con la paleta propia: acentos `#116ee6` y acción principal `#4c589c`, fondo `slate-50`.
- Arriba: buscador de paciente con forma de campo y el indicador "Ningún paciente seleccionado".
- Secciones en dos grupos plegables:
  - "Antecedentes": patológicos, no patológicos, alergias, quirúrgicos y anestésicos, enfermedades preexistentes;
  - "Evaluación clínica": síntomas, signos vitales, estudios de laboratorio.
- Estado más discreto: ✓ verde para completada y punto ámbar para en progreso.
- En escritorio, botón para contraer la barra a solo íconos.
- Ancho ajustado a 17rem para que ninguna etiqueta se corte.

**Archivos afectados:** `frontend/components/home/Sidebar.tsx`, `frontend/components/home/clinicalSections.ts`, `frontend/components/home/HomeScreen.tsx`.

**Verificación automática:** `tsc` y `eslint` sin errores; captura sin ventana de Edge a 1280 px revisada. La primera captura mostraba "Enfermedades preexistentes" cortado, y se corrigió ensanchando la barra.

**Revisión humana:** Pendiente.

### P-12. Quitar los puntos de estado y convertir "Buscar paciente" en botón

| Campo | Valor |
|---|---|
| Fecha | 2026-11-16 |
| Autor del prompt | Lucía |
| Objetivo | Simplificar la barra lateral |
| Especificación / tarea | T30 |

**Prompt**

> Eliminaremos el dot naranja ese y todo tipo de dots en el sidebar, se ven como de notificación y no me gustan. La palomita de completada sí déjala, porque esa se entiende.
>
> Y "Buscar paciente" lo pondremos más como un botón que como un campo, porque igual no se escribe ahí. Que sea un botón relleno, con su texto centrado.

**Resultado de la IA:** se eliminaron el punto ámbar de "en progreso" y los puntos sobre los íconos con la barra contraída. Se conserva la ✓ de "completada", que es un ícono y no un punto. "Buscar paciente" pasó de campo de búsqueda a botón relleno en `#116ee6` con texto blanco centrado.

**Archivos afectados:** `frontend/components/home/Sidebar.tsx`.

**Verificación automática:** `tsc` y `eslint` sin errores; captura sin ventana de Edge revisada.

**Revisión humana:** Corregido por el equipo; la corrección del diseño de P-11 originó este prompt.

### P-13. Barra superior de la pantalla principal

| Campo | Valor |
|---|---|
| Fecha | 2026-11-16 |
| Autor del prompt | Lucía |
| Objetivo | Agregar una barra de navegación superior que no se superponga con la barra lateral |
| Especificación / tarea | T31 |

**Prompt**

> ¿Es posible colocar un nav bar general arriba del sidebar, o que no se superponga con el sidebar? Que quede arriba de todo pero sin encimarse con la barra lateral.
>
> Con las funciones necesarias como el perfil del doctor, o sea un icono circular y su nombre, una bienvenida tipo "Buenas Tardes .... nombre", y las demás funciones más esenciales que consideres.

Mensaje enviado durante la tarea:

> No pongas un nombre en específico ni nada por el estilo por ahora, puedes dejarlo como {nombre} o algo así, como un indicativo, porque todavía no hay sesión.

**Resultado de la IA:**

- `TopNavbar.tsx`: barra superior fija dentro del área de contenido, a la derecha de la barra lateral. Contiene:
  - el saludo según la hora ("Buenos días", "Buenas tardes" o "Buenas noches"), que se actualiza cada minuto;
  - la fecha larga;
  - los botones de notificaciones y ayuda;
  - el menú de cuenta.
- `ProfileMenu.tsx`: avatar circular con nombre y especialidad, y un menú con "Mi perfil", "Configuración" y "Cerrar sesión". Por ahora, "Cerrar sesión" solo vuelve a `/login`.
- `lib/greeting.ts` y `currentDoctor.ts`.
- La IA usó primero un nombre de ejemplo ("Dr. Juan Pérez"). Por indicación de la usuaria, se reemplazó por los indicadores `{nombre}` y `{especialidad}`, y el avatar muestra un ícono mientras no haya iniciales.
- En celular, la barra incluye el botón ☰ que abre la barra lateral; reemplaza el encabezado móvil anterior.

**Archivos afectados:** `frontend/components/home/TopNavbar.tsx`, `ProfileMenu.tsx`, `currentDoctor.ts`, `HomeScreen.tsx` y `frontend/lib/greeting.ts`.

**Verificación automática:** `tsc` y `eslint` sin errores; capturas sin ventana de Edge a 1280 px y 500 px.

**Revisión humana:** Corregido: nombre de ejemplo → indicador `{nombre}` (A-06).

### P-14. Barra lateral contraída con botones cuadrados

| Campo | Valor |
|---|---|
| Fecha | 2026-11-16 |
| Autor del prompt | Lucía |
| Objetivo | Mejorar la forma y la distribución de la barra lateral contraída |
| Especificación / tarea | T30 |

**Prompt**

> Cuando el sidebar está minimizado los iconos se ven como rectángulos estirados de lado a lado y queda feo. Coloquemos el sidebar minimizado de una mejor forma: que los iconos no sean rectangulares sino cuadrados, con mejor distribución y mejor forma.
>
> Nada más eso, la barra expandida déjala como está.

Se adjuntó una captura de la barra contraída, con botones rectangulares de ancho completo.

**Resultado de la IA:**

- Con la barra contraída, todos los botones son cuadrados de 40×40 px centrados en los 72 px de ancho: contraer/expandir, buscar paciente, secciones y guardar. Se definieron con una constante común, `COLLAPSED_SQUARE`.
- Los íconos de buscar y guardar pasan a 20 px.
- Separadores de grupo cortos y centrados (32 px) y espaciado uniforme entre secciones (6 px).
- La barra expandida no cambia.

**Archivos afectados:** `frontend/components/home/Sidebar.tsx`.

**Verificación automática:** `tsc` y `eslint` sin errores. Para la captura sin ventana, la barra se dejó contraída por defecto de forma temporal y luego se restauró; se revisaron las capturas contraída y expandida.

**Revisión humana:** Corregido por el equipo; la corrección del diseño de P-11 originó este prompt.

### P-15. Íconos del mismo tamaño en la barra contraída

| Campo | Valor |
|---|---|
| Fecha | 2026-11-16 |
| Autor del prompt | Lucía |
| Objetivo | Consistencia visual (UX/UI) en la barra lateral contraída |
| Especificación / tarea | T30 |

**Prompt**

> De preferencia hay que seguir el diseño UX/UI, y ahí lo importante es la consistencia: todos los iconos del mismo tamaño en el menú minimizado. Ahorita unos se ven más chicos que otros y se nota.
>
> Iguala todos al mismo tamaño, incluyendo el de contraer y el de guardar.

**Resultado de la IA:** con la barra contraída, todos los íconos (contraer, buscar, secciones y guardar) miden ahora 20 px. Antes, los de las secciones medían 18 px. Se definió la constante `COLLAPSED_ICON` para mantener la regla en un solo lugar.

**Archivos afectados:** `frontend/components/home/Sidebar.tsx`.

**Verificación automática:** `tsc` y `eslint` sin errores.

**Revisión humana:** Corregido por el equipo; la inconsistencia de tamaños de P-14 originó este prompt.

### P-16. Etiquetas emergentes en la barra contraída

| Campo | Valor |
|---|---|
| Fecha | 2026-11-16 |
| Autor del prompt | Lucía |
| Objetivo | Mostrar el nombre de cada ícono de la barra contraída al pasar el cursor |
| Especificación / tarea | T30 |

**Prompt**

> Con el menú minimizado nadie sabe qué es cada icono. ¿Podemos colocar unas etiquetas de fondo negro y texto blanco, del texto que debería ir, al pasar el cursor por el icono? Así al menos se entiende sin tener que expandir la barra.
>
> Solo en el menú minimizado, en el expandido ya se lee el nombre.

**Resultado de la IA:**

- Nuevo componente reutilizable `components/ui/Tooltip.tsx`: etiqueta negra (`slate-950`) con texto blanco y flecha, a la derecha del ícono. Aparece al pasar el cursor o al enfocar con el teclado.
- La etiqueta se monta en `document.body` con posición fija, para que no la recorte la lista de secciones, que tiene desplazamiento vertical.
- Se aplicó a contraer/expandir, buscar paciente, cada sección y guardar, solo con la barra contraída.
- Se quitaron los `title` nativos para no mostrar dos etiquetas a la vez.

- **Cursor:** a pedido de Lucía ("sin poner el cursor prohibido"), las secciones bloqueadas usan el cursor normal (`cursor-default`) en lugar del prohibido.

**Archivos afectados:** `frontend/components/ui/Tooltip.tsx`, `frontend/components/home/Sidebar.tsx`.

**Verificación automática:** `tsc` y `eslint` sin errores. El paso del cursor no se probó con capturas sin ventana; hay que comprobarlo en el navegador.

**Revisión humana:** Pendiente.

### P-17. Bordes de 2 px, tamaños de texto y sin sombras

| Campo | Valor |
|---|---|
| Fecha | 2026-11-16 |
| Autor del prompt | Lucía |
| Objetivo | Unificar bordes y tamaños de texto de la pantalla principal |
| Especificación / tarea | T30, T31 |

**Prompt**

> De preferencia, coloca todos los bordes de la pantalla principal de tamaño 2px, para que se vean parejos y no unos de 1px y otros más gruesos. Y usa `text-base` para los textos generales y `text-md` para los textos medianos en la pantalla principal, creo que es esta la clase para los medianos.
>
> Es para que todo tenga la misma jerarquía, no para agrandar todo.

Mensaje enviado durante la tarea:

> Y elimina todos los boxshadows o textshadows de la pantalla principal, que se vea plano, sin sombritas.

**Resultado de la IA:**

- Todos los bordes, divisores, el contorno de la sección activa y el separador vertical de la barra superior pasan a 2 px.
- `text-md` no existe en Tailwind. Se interpretó "mediano" como `text-lg` (18 px), que se usa en el saludo y en el nombre del sistema. Todos los demás textos (antes de 13, 14 y 15 px) pasan a `text-base` (16 px), incluida la etiqueta emergente.
- Se eliminaron las 5 sombras: botones de buscar y guardar, sección activa, menú de cuenta y etiqueta emergente. No había sombras de texto.
- Con el texto a 16 px, la barra lateral se ensanchó a 18rem para que "Enfermedades preexistentes" no se corte.
- "Ningún paciente seleccionado" se acortó a "Sin paciente seleccionado" para que quepa en una línea.

**Archivos afectados:** `frontend/components/home/Sidebar.tsx`, `TopNavbar.tsx`, `ProfileMenu.tsx` y `frontend/components/ui/Tooltip.tsx`.

**Verificación automática:** `tsc` y `eslint` sin errores; capturas sin ventana de Edge a 1280 px revisadas tras cada ajuste.

**Revisión humana:** Pendiente. Falta confirmar la interpretación de `text-md` como `text-lg`.

### P-18. Animación al abrir y cerrar los grupos de la barra lateral

| Campo | Valor |
|---|---|
| Fecha | 2026-11-16 |
| Autor del prompt | Lucía |
| Objetivo | Animar el despliegue de "Antecedentes" y "Evaluación clínica" |
| Especificación / tarea | T30 |

**Prompt**

> Ponles un efecto de animación al abrir o cerrar Antecedentes o Evaluación clínica. Ahora nomás aparecen y desaparecen de golpe y se siente brusco.
>
> Algo sencillo, que se desplieguen y se plieguen, y que la flechita acompañe el movimiento.

**Resultado de la IA:**

- La lista de cada grupo se despliega y se pliega animando la altura (técnica de cuadrícula `grid-rows-[0fr]` → `grid-rows-[1fr]`) y la opacidad, en 300 ms con `ease-out`. La flecha gira al mismo ritmo.
- Cerrado, el contenido queda `inert`: no recibe foco ni lo lee el lector de pantalla.
- Respeta "reducir movimiento" del sistema.
- Se ajustaron los márgenes internos de la lista para que el recorte necesario para la animación no corte el contorno de la sección activa ni el anillo de foco.

**Archivos afectados:** `frontend/components/home/Sidebar.tsx`.

**Verificación automática:** `tsc` y `eslint` sin errores. La captura sin ventana confirma que el contorno de la sección activa se ve completo. La animación en sí hay que verla en el navegador.

**Revisión humana:** Pendiente.

### P-19. Animación de los grupos más fluida y original

| Campo | Valor |
|---|---|
| Fecha | 2026-11-16 |
| Autor del prompt | Lucía |
| Objetivo | Que la animación de los grupos no se trabe y sea más suave y original |
| Especificación / tarea | T30 |

**Prompt**

> Ponlo mejor, mejora esa animación, que no dé lag o se trabe, estén optimizadas, que sea más suave y más original. La de ahorita se siente tosca y como que da tironcitos.
>
> Quiero que se sienta fluida y con algo propio, no la típica animación genérica.

**Resultado de la IA:**

- **Causa del tirón:** la versión anterior (P-18) animaba `grid-template-rows`, lo que obliga a recalcular la cuadrícula en cada fotograma.
- **Nuevo componente reutilizable `components/ui/Collapsible.tsx`:**
  - mide la altura real una vez por apertura o cierre y la anima con la Web Animations API, sin re-renderizados de React por fotograma;
  - apertura en 360 ms y cierre en 260 ms, con `cubic-bezier(0.22, 1, 0.36, 1)`;
  - si se interrumpe a la mitad (doble clic), continúa desde la altura actual sin saltos;
  - respeta "reducir movimiento" y deja el contenido `inert` cuando está cerrado.
- **Efecto propio:**
  - al abrir, las secciones entran en cascada (35 ms entre cada una) deslizándose desde la izquierda, animando solo `transform` y `opacity`;
  - al cerrar, salen juntas y rápido (150 ms);
  - la flecha gira con un leve rebote.

**Archivos afectados:** `frontend/components/ui/Collapsible.tsx`, `frontend/components/home/Sidebar.tsx`.

**Verificación automática:** `tsc` y `eslint` sin errores. La fluidez no se puede medir con capturas sin ventana; hay que comprobarla en el navegador.

**Revisión humana:** Pendiente.

### P-20. Barra lateral azul cielo oscuro, sólida

| Campo | Valor |
|---|---|
| Fecha | 2026-11-16 |
| Autor del prompt | Lucía |
| Objetivo | Cambiar la barra lateral a un fondo azul oscuro sólido con textos claros y buen contraste |
| Especificación / tarea | T30 |

**Prompt**

> ¿Te parece si colocamos dicho sidebar de color azul cielo oscuro de fondo, sin gradiente, solo sólido, y los textos claros y demás, que contraste? El gris claro actual se ve muy plano y muy de prototipo.
>
> Que se vea serio, pero legible: el fondo oscuro y todo lo de arriba claro.

Mensaje enviado durante la tarea:

> Dije sin ningún tipo de gradiente.

**Resultado de la IA:**

- Fondo sólido `bg-sky-900` (`#0c4a6e`), sin gradientes. Se verificó con una búsqueda que no hay clases de gradiente en la pantalla principal.
- Textos blancos y `sky-100` (contraste 9.7:1 con blanco), títulos de grupo e íconos en `sky-300`, y separadores y estados *hover* en blanco translúcido.
- "Buscar paciente" en blanco con texto azul oscuro y "Guardar" en `#116ee6`. El `#4c589c` anterior no contrastaba con el fondo.
- Sección activa: píldora blanca con el ícono en `#116ee6`.
- Logo sobre un recuadro blanco y anillo de foco `sky-300`.
- El único degradado visible es el del propio archivo del logo (`logoxd.png`); no es parte del fondo.

**Archivos afectados:** `frontend/components/home/Sidebar.tsx`.

**Verificación automática:** `tsc` y `eslint` sin errores; captura sin ventana de Edge a 1280 px revisada.

**Revisión humana:** Pendiente.

### P-21. Fondo `blue-900`, color de "Buscar paciente" y de los *hovers*

| Campo | Valor |
|---|---|
| Fecha | 2026-11-16 |
| Autor del prompt | Lucía |
| Objetivo | Ajustar los colores de la barra lateral |
| Especificación / tarea | T30 |

**Prompt**

> Coloca "Buscar paciente" y los hovers de otro color, porque así como están se pierden con el fondo. Ah, por cierto, lo cambié a `bg-blue-900`, le queda mejor.
>
> Busca tonos que sí resalten y se distingan, y respeta el `bg-blue-900` que puse.

**Resultado de la IA:**

- Se conserva el cambio manual de la usuaria a `bg-blue-900` (ver A-07).
- Al editar, el borde derecho quedó sin color (`border-r-2` solo). En Tailwind 4 eso toma el color del texto y se habría visto una línea clara. Se le asignó `border-blue-950`.
- "Buscar paciente" pasa a celeste `sky-400` con texto `blue-950`, y a `sky-300` al pasar el cursor.
- Los *hovers* de las secciones, del botón de contraer y del de cerrar pasan de blanco translúcido a `blue-800` sólido.
- El texto de la sección activa y el anillo de foco se ajustaron a la gama `blue`.

**Archivos afectados:** `frontend/components/home/Sidebar.tsx`.

**Verificación automática:** `tsc` y `eslint` sin errores; captura sin ventana de Edge a 1280 px revisada.

**Revisión humana:** Corregido (cambio manual a `bg-blue-900`, A-07).

### P-22. Sección seleccionada sin fondo blanco y textos solo en blanco

| Campo | Valor |
|---|---|
| Fecha | 2026-11-16 |
| Autor del prompt | Lucía |
| Objetivo | Quitar el recuadro blanco y los textos azulados de la barra lateral |
| Especificación / tarea | T30 |

**Prompt**

> Y ese hover blanco, no me gusta. Se ve como un parche encima del azul.

Se adjuntó una captura con "Enfermedades preexistentes" seleccionada (píldora blanca) y "Alergias" con el cursor encima.

Mensaje enviado durante la tarea:

> No pongas textos azules, solo blancos o así.

**Resultado de la IA:**

- Se aclaró que el recuadro blanco era la sección **seleccionada**, no el *hover*.
- La sección seleccionada pasa a azul sólido `blue-700` con texto e ícono blancos y en `font-semibold`. Se distingue del *hover* `blue-800`.
- Todos los textos e íconos de la barra pasan a blanco: `text-white` para lo principal; `text-white/80` y `text-white/70` para lo secundario (títulos de grupo, íconos, "Sin paciente seleccionado").
- "Buscar paciente" pasa a `sky-700` con texto blanco (contraste 5.9:1). Con texto blanco, el `sky-400` anterior no tenía contraste suficiente.

**Archivos afectados:** `frontend/components/home/Sidebar.tsx`.

**Verificación automática:** `tsc` y `eslint` sin errores; una búsqueda confirma que no quedan clases `text-sky-*` ni `text-blue-*`; captura sin ventana de Edge revisada.

**Revisión humana:** Corregido por el equipo; la corrección del diseño de P-20 y P-21 originó este prompt.

### P-23. Paleta para el fondo negro y barra de desplazamiento moderna

| Campo | Valor |
|---|---|
| Fecha | 2026-11-16 |
| Autor del prompt | Lucía |
| Objetivo | Adaptar los colores de la barra lateral al fondo `bg-black/90` y modernizar su barra de desplazamiento |
| Especificación / tarea | T30 |

**Prompt**

> Mejor lo puse en `bg-black/90`. ¿Podrías adaptar todos los colores para que se vea premium y profesional a este fondo? Ahorita los azules ya no pegan con el negro.
>
> Y de paso soluciona ese color de scrollbar, se ve anticuado estando ahí. También sale una barra horizontal en el minimizado que no debería.

Se adjuntaron capturas de la barra expandida y contraída. Ambas mostraban la barra de desplazamiento clásica del navegador, y la contraída también una barra horizontal.

**Resultado de la IA:**

- Se conserva el cambio manual de la usuaria a `bg-black/90` (A-08).
- Paleta neutra (`zinc`) para el fondo negro:
  - textos `zinc-100`/`zinc-300`; títulos e íconos `zinc-400`;
  - *hover* `white/6`; sección activa `white/12` con texto blanco;
  - borde y separadores `white/10`; palomita `emerald-400`.
- Acentos:
  - "Buscar paciente" en blanco con texto `zinc-900`;
  - "Guardar" en `#116ee6`;
  - anillo de foco `white/60`.
- Barra de desplazamiento delgada y transparente, que solo se ve (blanco al 20 %) al pasar el cursor o con el foco dentro. Con la barra contraída se oculta. Se agregó `overflow-x-hidden` para eliminar la barra horizontal.
- Las etiquetas pasan de `truncate` a `leading-snug`: si no caben, pasan a una segunda línea en lugar de cortarse.
- Primero se intentó con reglas en `globals.css`, pero el servidor de desarrollo siguió entregando una versión en caché de ese archivo. Se pasaron a clases de Tailwind dentro de `Sidebar.tsx` (constante `SIDEBAR_SCROLLBAR`) y se retiró el bloque de `globals.css`.

**Archivos afectados:** `frontend/components/home/Sidebar.tsx` (`globals.css` quedó igual que antes).

**Verificación automática:** `tsc` y `eslint` sin errores. Capturas sin ventana de Edge a 1280×560 de la barra expandida y contraída (contraída por defecto de forma temporal, luego restaurada); ya no aparece la barra de desplazamiento clásica.

**Revisión humana:** Corregido (cambio manual a `bg-black/90`, A-08).

### P-24. Barra superior en `bg-blue-900`

| Campo | Valor |
|---|---|
| Fecha | 2026-11-16 |
| Autor del prompt | Lucía |
| Objetivo | Dar a la barra superior un fondo sólido azul con elementos claros |
| Especificación / tarea | T31 |

**Prompt**

> ¿Podrías colocar el topbar de color de fondo sólido `bg-blue 900` y los textos y elementos claros? Igual que el sidebar, sólido, sin transparencias ni desenfoques.
>
> El saludo, el nombre y los iconos que se lean bien sobre ese azul.

**Resultado de la IA:**

- Barra superior en `bg-blue-900` sólido (se quitaron la transparencia y el desenfoque) con borde inferior `blue-950`.
- Saludo y nombre en blanco; fecha y especialidad en `white/70`.
- Íconos de notificaciones, ayuda y menú en `white/80`, con *hover* `white/10`.
- Avatar `white/15` con ícono blanco; separador `white/20`; anillo de foco `white/60`.
- El menú desplegable de cuenta sigue siendo blanco.

**Archivos afectados:** `frontend/components/home/TopNavbar.tsx`, `frontend/components/home/ProfileMenu.tsx`.

**Verificación automática:** `tsc` y `eslint` sin errores; captura sin ventana de Edge a 1280 px revisada.

**Revisión humana:** Pendiente.

### P-25. Avatar amarillo

| Campo | Valor |
|---|---|
| Fecha | 2026-11-16 |
| Autor del prompt | Lucía |
| Objetivo | Destacar el avatar del médico en la barra superior |
| Especificación / tarea | T31 |

**Prompt**

> Coloca este con fondo de color amarillo, con el icono de color negro. Quiero que resalte y que se note que es el usuario, ahorita se pierde con el azul de la barra.

Se adjuntó un recorte del avatar de la barra superior.

**Resultado de la IA:** el avatar pasa a `bg-yellow-400` con el ícono, y las iniciales cuando existan, en `text-black`. El negro sobre `yellow-400` tiene un contraste de aproximadamente 14:1.

**Archivos afectados:** `frontend/components/home/ProfileMenu.tsx`.

**Verificación automática:** `tsc` y `eslint` sin errores; recorte de la captura sin ventana de Edge revisado.

**Revisión humana:** Pendiente.

### P-26. Barra lateral en azul marino muy oscuro

| Campo | Valor |
|---|---|
| Fecha | 2026-11-16 |
| Autor del prompt | Lucía |
| Objetivo | Armonizar la barra lateral con la barra superior azul |
| Especificación / tarea | T30 |

**Prompt**

> ¿Se ve bien? Siento que se vería mejor si en vez de negro fuera un azul muy oscuro, muy oscuro, en el sidebar. El negro con el azul del topbar se sienten como de dos paletas distintas.
>
> Muy oscuro, que casi se confunda con negro pero azul, y que los grises de adentro también se vayan al azul para que combine.

Se adjuntó una captura de la pantalla principal completa.

**Resultado de la IA:**

- Opinión: la pantalla se ve bien, pero el negro de la barra lateral y el `blue-900` de la barra superior pertenecen a familias de color distintas.
- El fondo pasa de `bg-black/90` a un azul marino casi negro sólido, `bg-[#0b1533]`, más oscuro que `blue-950` para diferenciarse de la barra superior.
- Los grises neutros (`zinc`) pasan a grises azulados (`slate`), que armonizan con el azul.
- El desplazamiento del anillo de foco se ajustó al nuevo fondo.

**Archivos afectados:** `frontend/components/home/Sidebar.tsx`.

**Verificación automática:** `tsc` y `eslint` sin errores; captura sin ventana de Edge a 1280×640 revisada.

**Revisión humana:** Pendiente.

### P-27. Fondo del contenido con degradado disperso

| Campo | Valor |
|---|---|
| Fecha | 2026-11-16 |
| Autor del prompt | Lucía |
| Objetivo | Dar al fondo blanco del área de contenido un acabado premium, muy sutil |
| Especificación / tarea | T31 |

**Prompt**

> El fondo principal, el blanco, colócalo con un gradiente disperso y no lineal, demasiado sutil y poco visible, de colores blancos y grises, tipo premium. Que no se note a la primera, que nada más le quite lo plano.
>
> No toques el sidebar ni el topbar, solo el fondo del área de contenido.

**Resultado de la IA:** el área de contenido conserva el fondo blanco y suma cuatro degradados radiales superpuestos, en blanco y grises muy claros (`slate-100` y `slate-200` con opacidad de 0.35 a 0.9), ubicados en distintas esquinas y sin dirección lineal. Se definió en la constante `CONTENT_BACKGROUND` de `HomeScreen.tsx`. Es estático, sin animación ni costo de rendimiento. La barra lateral y la superior no cambian.

**Archivos afectados:** `frontend/components/home/HomeScreen.tsx`.

**Verificación automática:** `tsc` y `eslint` sin errores; captura sin ventana de Edge a 1280×640 revisada (las manchas se perciben apenas).

**Revisión humana:** Pendiente.

### P-28. Fondo tipo aurora con grano, en lugar de degradados radiales

| Campo | Valor |
|---|---|
| Fecha | 2026-11-16 |
| Autor del prompt | Lucía |
| Objetivo | Ajustar la intensidad del fondo y reemplazar los degradados radiales por un acabado más moderno |
| Especificación / tarea | T31 |

**Prompts (tres mensajes consecutivos)**

> Que se noten un poco más. Ahorita no se ve nada y entonces no sirve de nada.

> No me refiero a que sean simples círculos radiales o gradientes, lo quiero mejor, se ven anticuados esos círculos. Algo como manchas orgánicas, con algo de textura.

> Bien, pero que se vea más sutil. Así ya parece manchado.

**Resultado de la IA:**

- Primero se subió la opacidad de los degradados radiales de P-27.
- Tras la aclaración, se reemplazaron por un componente nuevo, `components/ui/AuroraBackground.tsx`:
  - cuatro formas orgánicas asimétricas (curvas de Bézier en SVG) en `slate-200`, `slate-300` y blanco, difuminadas con `feGaussianBlur` (70);
  - una textura de grano (ruido fractal `feTurbulence`) casi imperceptible con `mix-blend-multiply`.
- Es estático, sin animación. Se retiró la constante `CONTENT_BACKGROUND` de `HomeScreen.tsx`.
- Por último se bajó la intensidad: formas grises a opacidad 0.28–0.5 y grano al 4 %.

**Archivos afectados:** `frontend/components/ui/AuroraBackground.tsx`, `frontend/components/home/HomeScreen.tsx`.

**Verificación automática:** `tsc` y `eslint` sin errores; capturas sin ventana de Edge a 1280×640 revisadas en cada ajuste.

**Revisión humana:** Corregido por el equipo; dos correcciones de diseño sobre P-27 y sobre la primera versión de la aurora originaron estos prompts.

### P-29. Tirones al contraer y expandir la barra lateral

| Campo | Valor |
|---|---|
| Fecha | 2026-11-16 |
| Autor del prompt | Lucía |
| Objetivo | Eliminar los tirones que aparecieron al contraer y expandir la barra lateral |
| Especificación / tarea | T30, T31 |

**Prompt**

> Se empezó a lagear mucho al abrir y minimizar el sidebar. Antes iba fluido y ahora da tirones cada vez que lo contraigo o lo expando, sobre todo con el fondo nuevo.
>
> ¿Puedes revisar por qué pasa y arreglarlo? Que se vuelva a sentir fluido como antes.

**Resultado de la IA:**

- **Causa (introducida en P-28):** la barra lateral anima su ancho, así que el área de contenido cambia de tamaño en cada fotograma. Como el fondo aurora ocupaba esa área, el navegador recalculaba en cada fotograma el desenfoque SVG (`feGaussianBlur` de 70, muy costoso) y la mezcla `mix-blend-multiply` del grano.
- **Corrección en `AuroraBackground.tsx`:**
  - el fondo pasa a `fixed inset-0`, del tamaño de la ventana, y ya no cambia de tamaño con la barra;
  - `will-change-transform` y `contain: strict` lo ponen en su propia capa, que se dibuja una vez y se reutiliza;
  - el grano usa opacidad simple, sin modo de mezcla.
- Se quitó `overflow-hidden` del `<main>` en `HomeScreen.tsx`, porque ya no hace falta.

**Archivos afectados:** `frontend/components/ui/AuroraBackground.tsx`, `frontend/components/home/HomeScreen.tsx`.

**Verificación automática:** `tsc` y `eslint` sin errores; captura sin ventana de Edge confirma que el fondo se ve igual y queda detrás de ambas barras. La fluidez no se midió automáticamente; hay que comprobarla en el navegador.

**Revisión humana:** Corregido por el equipo; el problema de rendimiento lo detectó la usuaria (A-09).

### P-30. Quitar el fondo aurora, agrandar el saludo y quitar el borde de la barra superior

| Campo | Valor |
|---|---|
| Fecha | 2026-11-16 |
| Autor del prompt | Lucía |
| Objetivo | Eliminar el fondo que causaba tirones y ajustar la barra superior |
| Especificación / tarea | T30, T31 |

**Prompts (tres mensajes consecutivos)**

> Aún sigue dicho tirón, mejor elimina lo del fondo blanco y sus gradientes. Ya mejor blanco liso y ya.

> Coloca el "Buenas noches, {nombre}" un poco más grandecito.

> Elimina el borde del topbar, esa línea de abajo.

**Resultado de la IA:**

- Se eliminó `components/ui/AuroraBackground.tsx` y su uso. El área de contenido vuelve a blanco liso.
- Se intentó medir el tiempo de los fotogramas de la animación con un navegador sin ventana controlado por script. La medición no fue válida (el navegador sin ventana pausa los fotogramas) y no se usó como evidencia.
- El saludo pasa de `text-lg` a `text-xl`.
- Se quitó el borde inferior de la barra superior (`border-b-2 border-blue-950`).

**Archivos afectados:** `frontend/components/home/HomeScreen.tsx`, `frontend/components/home/TopNavbar.tsx`; se borró `frontend/components/ui/AuroraBackground.tsx`.

**Verificación automática:** `tsc` y `eslint` sin errores; captura sin ventana de Edge revisada.

**Revisión humana:** Corregido: el equipo descartó el fondo aurora por rendimiento (A-10).

### P-31. Ventana de búsqueda de pacientes y avatar verde-cian

| Campo | Valor |
|---|---|
| Fecha | 2026-11-16 |
| Autor del prompt | Lucía |
| Objetivo | Buscador de pacientes registrados en una ventana modal, con filtros sencillos |
| Especificación / tarea | T32 |

**Prompt**

> Hagamos un popup grande que al darle clic al botón de "Buscar paciente" nos deje buscar por filtros sencillos y así. Será un popup de buscador de pacientes registrados, con su campo de búsqueda arriba y los filtros abajo.
>
> Que se pueda cerrar fácil y que se entienda aunque no le expliques a nadie.

Mensaje enviado durante la tarea, con un recorte del avatar:

> Mejor colócalo de verde-cyan este fondo, el amarillo ya no.

**Resultado de la IA:**

- **Modelo:** `types/patient.ts`, con el paciente y los criterios de búsqueda.
- **Lógica:** `lib/patientSearch.ts`, una función pura `filterPatients` que busca por nombre o expediente sin distinguir acentos ni mayúsculas, con filtros de sexo, rango de edad y última consulta, y contratos `@pre`/`@post`.
- **Datos de ejemplo:** `components/home/mockPatients.ts`, 12 pacientes con nombres indicativos ("Paciente de prueba 01"…).
- **Vista:** `components/home/PatientSearchDialog.tsx`.
  - Usa `<dialog>` nativo con `showModal()`: atrapa el foco, se cierra con Escape, con clic fuera o con "Cancelar", y el resto de la página queda inerte.
  - Contiene el campo de búsqueda con foco inicial, tres filtros con etiqueta visible, la lista de resultados navegable con teclado, un estado vacío con "Limpiar búsqueda y filtros" y un contador de resultados con `aria-live`.
  - Cada apertura empieza con la búsqueda limpia.
- **Conexión:** "Buscar paciente" abre la ventana (`aria-haspopup="dialog"`). Al elegir un paciente, su nombre reemplaza a "Sin paciente seleccionado" en la barra lateral (simulación).
- **Avatar:** pasa de `bg-yellow-400` a `bg-teal-400`, con el ícono negro.

**Archivos afectados:** `frontend/types/patient.ts`, `frontend/lib/patientSearch.ts`, `frontend/components/home/mockPatients.ts`, `frontend/components/home/PatientSearchDialog.tsx`, `frontend/components/home/Sidebar.tsx`, `frontend/components/home/HomeScreen.tsx`, `frontend/components/home/ProfileMenu.tsx`.

**Verificación automática:**

- `tsc` y `eslint` sin errores.
- 10 comprobaciones de `filterPatients` ejecutadas con Node: sin criterios, texto sin acentos, expediente, sexo, dos rangos de edad, dos filtros de última consulta, combinación sin resultados y criterios vacíos. Todas correctas.
- Captura sin ventana de Edge con la ventana abierta (abierta por defecto de forma temporal, luego restaurado).

**Revisión humana:** Pendiente.

### P-32. Botón "Cancelar" del buscador en azul marino

| Campo | Valor |
|---|---|
| Fecha | 2026-11-16 |
| Autor del prompt | Lucía |
| Objetivo | Ajustar el color del botón "Cancelar" de la ventana de búsqueda |
| Especificación / tarea | T32 |

**Prompt**

> En el popup, coloca este "Cancelar" de color de fondo azul oscuro muy oscuro y texto blanco. El mismo azul del sidebar, para que vaya con la paleta.

**Resultado de la IA:** "Cancelar" pasa de gris claro a `bg-[#0b1533]`, el mismo azul marino de la barra lateral, con texto blanco. Al pasar el cursor se aclara a `#1a2650`. El anillo de foco tiene un margen para que se distinga sobre el botón oscuro.

**Archivos afectados:** `frontend/components/home/PatientSearchDialog.tsx`.

**Verificación automática:** `tsc` y `eslint` sin errores.

**Revisión humana:** Pendiente.

### P-33. Quitar los pacientes de prueba

| Campo | Valor |
|---|---|
| Fecha | 2026-11-16 |
| Autor del prompt | Lucía |
| Objetivo | Dejar el buscador sin datos de ejemplo |
| Especificación / tarea | T32 |

**Prompt**

> Por ahora, eliminemos todos los pacientes de prueba. Son inventados y ya nos confunden cuando estamos probando lo demás.
>
> Que el buscador quede vacío, esperando los de la base de datos. El filtrado sí déjalo, solo quita los datos.

**Resultado de la IA:**

- Se borró `components/home/mockPatients.ts`.
- `HomeScreen.tsx` pasa al buscador una lista vacía (`REGISTERED_PATIENTS`), que se llenará cuando exista la conexión con la base de datos.
- Con la lista vacía, el buscador muestra "Aún no hay pacientes registrados" en lugar de "No se encontraron pacientes". El filtrado (`lib/patientSearch.ts`) no cambia.

**Archivos afectados:** `frontend/components/home/HomeScreen.tsx`, `frontend/components/home/PatientSearchDialog.tsx`; se borró `frontend/components/home/mockPatients.ts`.

**Verificación automática:** `tsc` y `eslint` sin errores; no quedan referencias a los datos de ejemplo.

**Revisión humana:** Pendiente.

### P-34. Tablas clínicas y carga de los CSV

| Campo | Valor |
|---|---|
| Fecha | 2026-11-16 |
| Autor del prompt | Lucía |
| Objetivo | Crear en SQL Server las tablas de la base de conocimiento y cargar los CSV entregados por el equipo de base de datos |
| Especificación / tarea | T33 |

**Prompt**

> Mi compañero dice que yo debo crear las tablas. Ya me pasó los archivos de los catálogos, son los CSV que están ahí, y hay que hacer las tablas en SQL Server y cargarles esos datos.
>
> Ayúdame a armarlo, porfa, que yo de base de datos casi no sé.

(Contexto: el compañero de base de datos entregó 15 archivos `IO_*.csv`.)

**Resultado de la IA:**

- `Sql/CreateClinicalTables.sql`: 16 tablas con llaves primarias, foráneas y restricciones `CHECK`. Es idempotente y no toca `dbo.USUARIOS`.
- `Sql/Tools/generate_clinical_seed.py` lee los CSV en Windows-1252, valida duplicados y referencias, y genera `Sql/SeedClinicalData.sql`. La carga borra y vuelve a llenar las tablas en una sola transacción.
- Se repararon los caracteres perdidos como `?` cuando la lectura era inequívoca: µ, β y los ≤ de la clasificación TNM.
- Decisiones de diseño:
  - La enfermedad de cada catálogo se toma del prefijo del identificador.
  - La relación paciente-hallazgo vive solo en `HALLAZGOS_PACIENTE`; se ignora la columna repetida `Id_Pacient` de los catálogos, después de comprobar que coincide.
  - `PACIENTES` agregaba `Sexo` y `FechaUltimaConsulta` con valor NULL, porque el buscador las necesita; se quitaron en P-35 (A-11).
  - `RESULTADOS_ESPERADOS` queda solo para evaluar al motor de diagnóstico.

**Archivos afectados:** `backend/XpertDiagnostic.Api/Sql/CreateClinicalTables.sql`, `Sql/SeedClinicalData.sql` (generado), `Sql/Tools/generate_clinical_seed.py`, `Sql/ClinicalData/IO_*.csv` (copia de los entregados) y `specs/guias/guia-instalacion.md`.

**Verificación automática:**

- Se ejecutaron los dos scripts, cada uno dos veces, en una base desechable (`XD_ScriptTest`) del SQL Server local. Después se borró esa base.
- Se cargaron 906 filas en 16 tablas; el conteo de cada tabla coincide con su CSV.
- Los acentos, µ, β y ≤ se guardan bien.
- Un primer intento falló porque `Plan` es palabra reservada; la columna se renombró a `PlanIndicado`.

**Pendiente con el equipo de base de datos:**

- Cuatro textos conservan `?` porque su lectura es ambigua: `?4 criterios`, `edad ?35 años`, `MIC de vancomicina ?2` y `clase ?III`.
- `ENFERMEDADES_ENDEMICAS` cita `CARDI00010`, `CARDI00020` y `CARDI00023`, que no existen. Por eso esa columna no tiene llave foránea.
- No hay tablas de doctores ni de hospitales.

**Revisión humana:** Pendiente.

### P-35. Quitar columnas agregadas a PACIENTES

| Campo | Valor |
|---|---|
| Fecha | 2026-11-16 |
| Autor del prompt | Lucía |
| Objetivo | Que `PACIENTES` tenga solo las columnas de los CSV |
| Especificación / tarea | T33 |

**Prompt**

> ¿Podrías eliminar lo de sexo y última consulta que pusiste en esa tabla? Es que en el CSV no vienen y no queremos poner nada adicional, solo lo que nos entregaron.
>
> Lo demás déjalo igual.

**Resultado de la IA:** se quitaron `Sexo`, `FechaUltimaConsulta` y su restricción de `CreateClinicalTables.sql`. El script de carga no cambia, porque no las llenaba.

**Archivos afectados:** `backend/XpertDiagnostic.Api/Sql/CreateClinicalTables.sql`.

**Verificación automática:** se ejecutaron los dos scripts en una base desechable del SQL Server local. `PACIENTES` quedó con 8 columnas y se cargaron los 10 pacientes. Después se borró esa base.

**Revisión humana:** Corrección de Lucía (A-11).

### P-36. Reemplazar el esquema anterior por las tablas clínicas

| Campo | Valor |
|---|---|
| Fecha | 2026-11-16 |
| Autor del prompt | Lucía |
| Objetivo | Borrar las tablas existentes en `XpertDiagnostic` y dejar solo las nuevas |
| Especificación / tarea | T33, T34 |

**Prompt**

> Mejor eliminemos estas tablas y hagamos lo nuevo. Las del esquema viejo ya no las vamos a usar y nomás estorban y confunden cuando uno abre la base.
>
> Bórralas todas y deja solo las nuevas que acabamos de crear. Respalda antes por si algo, y avísame si algo del login depende de las viejas.

La IA advirtió que 5 tablas tenían datos y que el login depende de ellas: `USUARIOS`, `MEDICOS`, `AREA_TRABAJO`, `ESPECIALIDADES` y `SUB_ESPECIALIDADES`. Recomendó conservarlas. Lucía eligió borrar todas, incluida `USUARIOS`.

**Resultado de la IA:**

- Respaldo completo antes de borrar: `C:\Program Files\Microsoft SQL Server\MSSQL17.MSSQLSERVER\MSSQL\Backup\XpertDiagnostic_antes_de_tablas_clinicas_2026-11-16.bak`. Se comprobó con `RESTORE VERIFYONLY`.
- Se quitaron todas las llaves foráneas y se borraron las 59 tablas del esquema anterior.
- Se ejecutaron `CreateClinicalTables.sql` y `SeedClinicalData.sql`: 16 tablas y 906 filas.

**Consecuencia:** el inicio de sesión no funciona hasta que exista otra vez `dbo.USUARIOS` (T34).

**Revisión humana:** Decisión de Lucía.

### P-37. Recuperar USUARIOS adaptada al nuevo esquema

| Campo | Valor |
|---|---|
| Fecha | 2026-11-16 |
| Autor del prompt | Lucía |
| Objetivo | Volver a tener el inicio de sesión sobre el esquema clínico |
| Especificación / tarea | T34 |

**Prompt**

> Puedes volver a usar solo usuarios, pero adaptarlo a las nuevas tablas. Solo esa, nada de las otras viejas.
>
> Saca la estructura del respaldo que hiciste y cópiala, pero sin las llaves a las tablas que ya no existen, y sin meter usuarios nuevos. Los que ya estaban los pasamos del respaldo.

**Resultado de la IA:**

- Se restauró el respaldo de P-36 en una base temporal (`XD_BackupRead`) para leer la estructura de `USUARIOS` sin mostrar contraseñas. La base temporal se borró al terminar.
- Nuevo `Sql/CreateUsersTable.sql`:
  - mismas columnas que antes (`IdUSUARIO`, `PASS`, `ROL`, `IdMEDICO`, `IdAREA`);
  - `PASS` en `VARCHAR(60)`, como espera `User.cs`;
  - sin llaves foráneas a `MEDICOS` ni a `AREA_TRABAJO`, que ya no existen;
  - no inserta usuarios.
- Se copiaron a `XpertDiagnostic` los 2 usuarios del respaldo. Sus contraseñas ya estaban en BCrypt. Los hashes no se escribieron en el repositorio.
- La guía de instalación indica ahora cuándo usar `CreateUsersTable.sql`.

**Archivos afectados:** `backend/XpertDiagnostic.Api/Sql/CreateUsersTable.sql`, `specs/guias/guia-instalacion.md`.

**Verificación automática:** `USUARIOS` existe con 2 filas. No se probó el login contra la API porque no estaba en ejecución.

**Revisión humana:** Pendiente.

### P-38. Médicos y cuentas de usuario

| Campo | Valor |
|---|---|
| Fecha | 2026-11-16 |
| Autor del prompt | Lucía |
| Objetivo | Identificar al médico que inicia sesión y permitir registrar médicos con su cuenta |
| Especificación / tarea | ESP-002, T35 a T39 |

**Prompt**

> También alguna forma para identificar al médico en cuestión, y para poder agregar médicos y crear sus cuentas como usuario y así. O sea que cuando entre un doctor se sepa quién es, y que alguien pueda dar de alta a los doctores con su cuenta.
>
> Sin lógica de más por ahora, pero que funcione.

**Decisiones de Lucía** (preguntadas por la IA):

- Una tabla `MEDICOS` más simple que la del esquema anterior.
- Las altas las hace un administrador desde la app.

**Resultado de la IA:**

- **Especificación primero:** `especificaciones/05-registro-medicos.md` (ESP-002) con los casos PT17 a PT28.
- **Pruebas antes del código:** `DoctorServiceTests.cs` (PT17 a PT22).
- **Base de datos:**
  - `Sql/CreateDoctorsAndUsersTables.sql`:
    - crea `MEDICOS` (`IdMedico`, `NombreCompleto`, `Especialidad`, `CedulaProfesional` única de 7 u 8 dígitos);
    - adapta `USUARIOS`: `IdAREA` opcional, regla `ROL IN ('M','A')` y llave foránea a `MEDICOS` cuando cada usuario tiene su médico.
  - Reemplaza a `CreateUsersTable.sql`, que se borró.
  - En la base real se aplicó el script y se pasó el médico 1 desde el respaldo, a través de una base temporal que después se borró.
- **Backend:**
  - `Doctor`, `UserRoles`, `CreateDoctorRequest`, `DoctorProfile` y `DoctorRegistrationResult`;
  - `IDoctorRepository`/`DoctorRepository`: guarda médico y cuenta en una transacción y trata los duplicados de SQL Server;
  - `IPasswordHasher`/`BCryptPasswordHasher` e `IDoctorService`/`DoctorService`;
  - `DoctorsController`: `GET /api/doctors/me` con sesión y `POST /api/doctors` solo para rol `A`;
  - `User.IdArea` pasa a ser opcional.
- **Frontend:**
  - `types/doctor.ts`, `lib/doctorValidation.ts` (las mismas reglas del backend), `lib/backendSession.ts` (reenvía el token de la cookie) y `services/doctorService.ts`;
  - rutas `app/api/session` y `app/api/doctors`;
  - la barra superior muestra el nombre y la especialidad reales y conserva `{nombre}` y `{especialidad}` si no hay sesión;
  - "Registrar médico" aparece en el menú de cuenta solo para administradores;
  - pantalla `/doctors/new` (`components/doctors/DoctorRegistrationForm.tsx`).
  - `app/api/login/route.ts` reutiliza las constantes de `backendSession.ts`.

**Verificación automática:**

- `dotnet test`: 23 de 23 pruebas, de las cuales 6 son nuevas.
- `tsc` y `eslint` sin errores.
- 11 comprobaciones de `validateDoctorRegistration` con Node.
- La API compilada se probó contra una base desechable con un administrador temporal. Después se borró esa base. Resultados:
  - 201 al crear;
  - 409 por ID repetido y 409 por cédula repetida;
  - 400 con datos inválidos;
  - 401 sin token o con token inválido;
  - 403 cuando un médico intenta registrar a otro;
  - el médico nuevo inicia sesión y `me` devuelve su nombre;
  - las contraseñas quedan en BCrypt.
- Captura de `/doctors/new` en escritorio.

**Incidencia:** un primer intento con `dotnet run --artifacts-path` ejecutó un binario viejo de `bin/Debug`. Se repitió con la compilación nueva.

**Pendiente:** decidir qué hacer con el usuario de prueba 123456, cuya cédula del esquema anterior es "PRUEBA01" y no es válida. Designar el primer administrador.

**Revisión humana:** Pendiente.

### P-39. Médico de prueba y primer administrador

| Campo | Valor |
|---|---|
| Fecha | 2026-11-16 |
| Autor del prompt | Lucía |
| Objetivo | Cerrar los pendientes de P-38 |
| Especificación / tarea | ESP-002, T35 |

**Decisiones de Lucía:**

- Conservar el usuario de prueba 123456.
- Hacer administrador al usuario 1.

**Prompt**

> El usuario de prueba 123456 lo conservamos, y al usuario 1 hazlo administrador. Su cédula profesional ponla simple porque es algo de prueba y es ficticio, ponle 0000000.

**Resultado de la IA:**

- `USUARIOS.ROL` del usuario 1 pasó de `M` a `A`.
- Se registró en `MEDICOS` el médico ficticio 123456 ("Medico Prueba", "Especialidad de prueba", cédula `0000000`).
- Se volvió a ejecutar `CreateDoctorsAndUsersTables.sql`, que agregó `FK_USUARIOS_MEDICOS`.

**Verificación automática:** los 2 usuarios tienen médico y la llave foránea existe.

**Revisión humana:** Decisión de Lucía.

### P-40. Filtros del buscador acordes a PACIENTES

| Campo | Valor |
|---|---|
| Fecha | 2026-11-16 |
| Autor del prompt | Lucía |
| Objetivo | Que el buscador filtre solo por datos que existen en la base |
| Especificación / tarea | T32 |

**Prompt**

> Puedes poner filtros básicos y quitar esos, acorde a nuestras tablas actuales. Los de sexo y última consulta ya no aplican porque esas columnas no existen en PACIENTES.
>
> Solo lo que sí está en la tabla: nombre, expediente, edad y diagnóstico.

**Resultado de la IA:**

- Se quitaron los filtros Sexo y Última consulta: esas columnas no existen en `PACIENTES` (A-11).
- Quedan:
  - la búsqueda por nombre o expediente (`IdPaciente`);
  - el filtro de **Edad**;
  - el filtro nuevo de **Diagnóstico**.
- Las opciones de Diagnóstico se calculan con los pacientes cargados (`getDiagnosisOptions`): en orden alfabético y con "Sin diagnóstico" si hace falta. Se llenarán solas al conectar la API.
- `Patient` cambia `sex` y `lastVisit` por `diagnosis`.
- Cada resultado muestra el diagnóstico en lugar de la fecha de la última consulta.

**Archivos afectados:** `frontend/types/patient.ts`, `frontend/lib/patientSearch.ts`, `frontend/components/home/PatientSearchDialog.tsx`.

**Verificación automática:** `tsc` y `eslint` sin errores; 10 comprobaciones del filtrado con Node.

**Revisión humana:** Pendiente.

### P-41. Distribución de la barra superior

| Campo | Valor |
|---|---|
| Fecha | 2026-11-16 |
| Autor del prompt | Lucía |
| Objetivo | Que la barra superior no se vea compacta |
| Especificación / tarea | T31 |

**Prompt**

> Ayúdame a mejorar la distribución del topbar para que no se vea tan compacto o estrecho todo. Ahorita está todo pegado y se siente apretado.
>
> Más aire entre las cosas, sin que se desarme la barra.

**Resultado de la IA:**

- **Barra:**
  - altura de 64 px a 80 px (72 px en móvil);
  - márgenes laterales de 24 px a 32 px.
- **Saludo y fecha:** 4 px de separación entre las dos líneas.
- **Íconos:**
  - área de clic más amplia;
  - más espacio entre ellos;
  - separador vertical más alto, con más margen.
- **Perfil:**
  - avatar de 36 px a 40 px;
  - más espacio entre avatar, nombre y especialidad;
  - el nombre y la especialidad se recortan con "…" si son muy largos;
  - el menú desplegable baja un poco y es más ancho.

**Archivos afectados:** `frontend/components/home/TopNavbar.tsx`, `frontend/components/home/ProfileMenu.tsx`.

**Verificación automática:** `tsc` y `eslint` sin errores; captura de `/home` a 1280 px.

**Revisión humana:** Pendiente.

### P-42. Panel derecho del expediente

| Campo | Valor |
|---|---|
| Fecha | 2026-11-16 |
| Autor del prompt | Lucía |
| Objetivo | Darle contenido coherente al panel derecho "Expediente de" del boceto |
| Especificación / tarea | T40 |

**Prompt**

> Hazlo ahora pero sin la lógica aún, solo cascaroncito y medio. O sea el panel derecho con su forma y sus secciones, pero los datos todavía no.
>
> Nada de mostrar el diagnóstico antes de tiempo, eso va después.

(Antes, la IA propuso el contenido del panel a partir de las tablas actuales. Advirtió que no debe mostrar `RESULTADOS_ESPERADOS`, ni el diagnóstico antes del paso de diagnóstico.)

**Resultado de la IA:**

- Nuevo `components/home/PatientRecordPanel.tsx`, solo visual. Contiene:
  - la ficha del paciente: nombre, expediente y edad; sin paciente, un estado vacío con el botón "Buscar paciente";
  - el avance de la captura, con una barra que se calcula con los estados de las secciones del sidebar;
  - los hallazgos registrados por tipo (síntomas, signos, estudios de laboratorio, diagnóstico diferencial, comorbilidades y complicaciones), con contador y etiquetas listas para recibir datos;
  - "Diagnóstico y plan", vacío hasta el paso de diagnóstico.
- **Pantallas `xl` (1280 px o más):** el panel es una columna fija de 320 px debajo de la barra superior.
- **Pantallas menores:** el panel se abre como cajón desde un botón nuevo de la barra superior. Se cierra con X, con Escape o al hacer clic fuera.
- `HomeScreen` centraliza `openPatientSearch`, que cierra los cajones antes de abrir el buscador.
- **Estilo:** bordes de 2px, `text-base`, sin sombras ni degradados.

**Archivos afectados:** `frontend/components/home/PatientRecordPanel.tsx` (nuevo), `HomeScreen.tsx`, `TopNavbar.tsx`.

**Verificación automática:**

- `tsc` y `eslint` sin errores.
- Capturas a 1440 px (columna), a 1100 px (botón) y con el cajón abierto. Para esta última se cambió un momento el estado inicial y después se restauró el archivo.

**Revisión humana:** Pendiente.

### P-43. Franja negra bajo la pantalla principal

| Campo | Valor |
|---|---|
| Fecha | 2026-11-16 |
| Autor del prompt | Lucía |
| Objetivo | Eliminar el espacio negro que aparecía al final de `/home` |
| Especificación / tarea | T40 |

**Prompt**

> Y ese espacio negro o margen negro que sale abajo, a eliminarlo. No debería poder bajarse la página.

**Causa:** en `PatientRecordPanel` (P-42), el área con scroll era un hijo flex sin `min-h-0`. Por eso crecía hasta el alto de su contenido en lugar de desplazarse. La página llegaba a 972 px en una ventana de 608 px, y debajo se veía el fondo oscuro del `body` (modo oscuro del sistema en `globals.css`).

**Corrección:**

- `min-h-0` en el área con scroll del panel.
- `overflow-hidden` en la columna y en el cajón del expediente, como resguardo.

**Archivos afectados:** `frontend/components/home/PatientRecordPanel.tsx`, `frontend/components/home/HomeScreen.tsx`.

**Verificación automática:**

- `tsc` y `eslint` sin errores.
- Se midió con Edge sin ventana (protocolo de DevTools): antes, página de 972 px en una ventana de 608 px; después, 608 px en 608 px.

**Revisión humana:** Error detectado por Lucía.

### P-44. Chat del asistente de IA (solo visual)

| Campo | Valor |
|---|---|
| Fecha | 2026-11-16 |
| Autor del prompt | Lucía |
| Objetivo | Construir el panel central del chat de XpertDiagnostic |
| Especificación / tarea | T41 |

**Prompt**

> Ahora vamos a hacer lo que irá en medio, pero bien ajustado y distribuido, sobre el chat de AI de "XpertDiagnostic". Con `logoxd.png` de preferencia como avatar de la AI, que se vea bien.
>
> Solo de cascaroncito este panel de IA, sin respuestas reales todavía.

**Resultado de la IA:** nuevo `components/home/AssistantChat.tsx`, con cuatro partes.

- **Encabezado de la sección activa:**
  - ícono, grupo y "Sección N de 8";
  - nombre de la sección;
  - etiqueta de estado.
- **Conversación, en una columna centrada de hasta 768 px:**
  - el asistente usa `logoxd.png` como avatar, en un círculo blanco con borde, y burbujas gris claro;
  - los mensajes del médico aparecen en burbujas azul marino, alineadas a la derecha.
  - Sin paciente, el asistente saluda y ofrece "Buscar paciente". Con paciente, pregunta por la sección y ofrece respuestas rápidas.
- **Caja de texto:**
  - crece con el contenido;
  - Enter envía y Shift+Enter hace salto de línea;
  - está desactivada sin paciente.
- **Pie:**
  - aviso "XpertDiagnostic es un apoyo; la decisión clínica es del médico";
  - botón "Siguiente: …" hacia la sección que sigue, o hacia Diagnóstico y tratamiento en la última.

Los mensajes del médico se agregan solo de forma local: todavía no hay IA. `HomeScreen` mide exactamente la altura de la ventana y el chat y el expediente hacen scroll por dentro.

**Archivos afectados:** `frontend/components/home/AssistantChat.tsx` (nuevo), `HomeScreen.tsx`.

**Verificación automática:** `tsc` y `eslint` sin errores; capturas sin paciente y con un paciente temporal de muestra (`{paciente}`, que se quitó después).

**Revisión humana:** Pendiente.

### P-45. Secciones bloqueadas y avance por el chat

| Campo | Valor |
|---|---|
| Fecha | 2026-11-16 |
| Autor del prompt | Lucía |
| Objetivo | Que la captura avance sección por sección |
| Especificación / tarea | T42 |

**Prompt**

> ¿Podrías eliminar eso de prueba que dice "Completo"? Lo del chat deberá iniciar tipo "En proceso" en Antecedentes Patológicos, y las demás secciones en el sidebar deberán estar bloqueadas, así con un icono de candado y de que no se puedan seleccionar.
>
> Pues va sección por sección mediante el chat de IA, no se puede brincar.

**Resultado de la IA:**

- **Estados iniciales:** se quitaron los de ejemplo (`complete` en Patológicos, `in-progress` en No patológicos). Ahora Patológicos empieza `in-progress` y las demás `pending`.
- **Bloqueo:** `isSectionLocked` define que una sección pendiente está bloqueada.
- **Sidebar, en cada sección bloqueada:**
  - candado y texto atenuado;
  - no se abre al hacer clic;
  - `aria-disabled` y "bloqueada" para el lector de pantalla;
  - tooltip "Se habilita al completar la sección anterior", en dos líneas desde P-46.
- **Avance:** `HomeScreen` guarda los estados. "Siguiente" en el chat marca la sección actual como completa (check verde) y deja la siguiente en proceso. Al elegir otro paciente, la captura vuelve a empezar.
- **Texto del estado:** "En progreso" pasa a ser "En proceso".
- **Página más alta que la ventana en `xl`:** reapareció con el panel del expediente.
  - **Causa:** los textos `sr-only` (`position: absolute`) no tenían un contenedor con `position: relative` dentro del área con scroll, así que se posicionaban respecto a la página.
  - **Corrección:** `relative` en las áreas con scroll del chat y del expediente.

**Archivos afectados:** `frontend/components/home/clinicalSections.ts`, `Sidebar.tsx`, `HomeScreen.tsx`, `AssistantChat.tsx`, `PatientRecordPanel.tsx`.

**Verificación automática:**

- `tsc` y `eslint` sin errores.
- Altura de la página igual a la ventana en 1440, 1365, 1100 y 420 px, medida con el protocolo de DevTools.
- Captura con las secciones bloqueadas.

**Revisión humana:** Pendiente.

### P-46. Tooltip en dos líneas para secciones bloqueadas

| Campo | Valor |
|---|---|
| Fecha | 2026-11-16 |
| Autor del prompt | Lucía |
| Objetivo | Que la etiqueta de las secciones bloqueadas no se vea tan alargada |
| Especificación / tarea | T42 |

**Prompts**

> Que no se vea tan alargado esta etiqueta al pasar cursor, se sale de la pantalla.

> O sea que diga como ante, pero que salto de línea o así. Que no sea una sola línea larguísima.

**Resultado de la IA:**

- **Primer intento:** acortó el texto a "Completa la anterior". Lucía prefirió conservar el texto original con salto de línea.
- **Corrección:** se restauró "Se habilita al completar la sección anterior".
  - `Tooltip` cambia `whitespace-nowrap` por `w-max max-w-56 text-balance leading-snug`.
  - Las etiquetas cortas siguen en una línea y las largas se dividen en líneas equilibradas.

- **Cursor:** a pedido de Lucía ("sin poner el cursor prohibido"), las secciones bloqueadas usan el cursor normal (`cursor-default`) en lugar del prohibido.

**Archivos afectados:** `frontend/components/ui/Tooltip.tsx`, `frontend/components/home/Sidebar.tsx`.

**Verificación automática:** `tsc` y `eslint` sin errores. Se tomó una captura con el cursor sobre "No patológicos", simulando el movimiento por el protocolo de DevTools: el texto queda en dos líneas.

**Revisión humana:** Corrección de Lucía.

### P-47. Etiqueta verde cyan en secciones desbloqueadas

| Campo | Valor |
|---|---|
| Fecha | 2026-11-16 |
| Autor del prompt | Lucía |
| Objetivo | Distinguir con color las secciones desbloqueadas |
| Especificación / tarea | T42 |

**Prompt**

> Pon la etiqueta de fondo verde cyan la que ya está desbloqueada y así, y su texto que contraste. Las bloqueadas déjalas con la etiqueta negra como están.
>
> Que de lejos se vea cuál sí se puede y cuál no.

**Resultado de la IA:**

- **`Tooltip`:** acepta un `tone`. `dark` (por defecto) es negro con texto blanco; `accent` es `bg-teal-400` con texto negro, como el avatar.
- **Secciones desbloqueadas:** al pasar el cursor muestran una etiqueta verde cyan con su estado, "En proceso" o "Completada". Con el sidebar contraído dicen "{sección}: en proceso".
- **Secciones bloqueadas:** conservan la etiqueta negra.
- **Contraste:** negro sobre `teal-400`, alrededor de 10:1 (cumple WCAG AA).

**Archivos afectados:** `frontend/components/ui/Tooltip.tsx`, `frontend/components/home/Sidebar.tsx`.

**Verificación automática:** `tsc` y `eslint` sin errores; captura con el cursor sobre "Patológicos".

**Revisión humana:** Pendiente.

### P-48. Etiqueta "Pendiente" en el chat

| Campo | Valor |
|---|---|
| Fecha | 2026-11-17 |
| Autor del prompt | Lucía |
| Objetivo | Cambiar la etiqueta de estado del encabezado del chat según una referencia visual |
| Especificación / tarea | T41 |

**Prompt**

> Coloca igual este badge que diga "Pendiente" en vez de "En proceso". Con el mismo estilo de la imagen: fondo clarito, con su iconito de reloj, y el texto oscuro para que se lea.

(Con la imagen de una etiqueta naranja "Waiting" con ícono de reloj.)

**Resultado de la IA:** la etiqueta del encabezado del chat ahora tiene fondo claro, texto del mismo tono, ícono y no lleva borde.

| Estado | Etiqueta | Colores | Ícono |
|---|---|---|---|
| Sección actual | "Pendiente" | `bg-orange-100` / `text-slate-900` (texto e ícono oscuros a pedido de Lucía; antes `text-orange-600`) | reloj |
| Completada | "Completada" | verde | check |
| Bloqueada | "Bloqueada" | gris | candado |

**Archivos afectados:** `frontend/components/home/AssistantChat.tsx`.

**Verificación automática:** `tsc` y `eslint` sin errores; captura de `/home` a 1440 px.

**Revisión humana:** Pendiente.

### P-49. Encabezado de la sección en el chat

| Campo | Valor |
|---|---|
| Fecha | 2026-11-17 |
| Autor del prompt | Lucía |
| Objetivo | Darle un acabado más cuidado al encabezado de la sección del chat |
| Especificación / tarea | T41 |

**Prompt**

> ¿Podrías ayudarme a que se vea mejor esta parte, premium-type? Es el encabezado de la sección y ahorita se ve muy soso, con el cuadrito gris y todo apretado.
>
> Que se sienta cuidado, con más jerarquía, pero sin recargarlo.

**Resultado de la IA:**

- **Ícono:** recuadro de 48 px en azul marino sólido (`#0b1533`) con el ícono blanco; antes era gris claro.
- **Línea superior:** "Antecedentes • Paso 1 de 8", con un punto como separador.
- **Título:** `text-xl` con letras un poco más juntas (`tracking-tight`).
- **Indicador de pasos:** debajo de la etiqueta de estado, 8 segmentos (verde completada, naranja actual y más ancho, gris pendiente). Es decorativo para el lector de pantalla, porque "Paso N de M" ya lo anuncia, y se oculta en móvil.
- `AssistantChat` recibe `steps` con el estado de cada sección desde `HomeScreen`.

**Archivos afectados:** `frontend/components/home/AssistantChat.tsx`, `HomeScreen.tsx`.

**Verificación automática:** `tsc` y `eslint` sin errores; recorte de captura del encabezado a 1440 px.

**Revisión humana:** Pendiente.

### P-50. Texto del encabezado de la sección

| Campo | Valor |
|---|---|
| Fecha | 2026-11-17 |
| Autor del prompt | Lucía |
| Objetivo | Mejorar solo el bloque "Antecedentes · Paso 1 de 8 / Patológicos" |
| Especificación / tarea | T41 |

**Prompt**

> Pero esta parte específicamente. Nada más este bloque de arriba: que "Antecedentes" se vea discreto, que "Paso 1 de 8" vaya en una píldora para que no se mezcle, y que "Patológicos" se vea grande y fuerte, en el azul oscuro.

**Resultado de la IA:**

- **"Antecedentes":** `font-medium text-slate-600`.
- **"Paso 1 de 8":** dentro de una píldora `bg-slate-100` con números de ancho fijo (`tabular-nums`).
- **Título:** `text-2xl font-bold tracking-tight` en azul marino `#0b1533`, con `leading-tight`.
- La caja de texto usa la clase `field-sizing-content`, que es la forma recomendada de Tailwind.

**Archivos afectados:** `frontend/components/home/AssistantChat.tsx`.

**Verificación automática:** `tsc` y `eslint` sin errores; recorte de captura del encabezado.

**Revisión humana:** Pendiente.

### P-51. Pie del chat: sin "Siguiente" y aviso para médicos

| Campo | Valor |
|---|---|
| Fecha | 2026-11-17 |
| Autor del prompt | Lucía |
| Objetivo | Dar más espacio al chat y dejar un aviso clínico adecuado a usuarios médicos |
| Especificación / tarea | T41, T42 |

**Prompts**

> Esta parte también la vamos a mejorar. Hay que eliminar eso del botón "Siguiente: No patológicos", porque ya lo va a manejar la IA. Y en su lugar coloca otra descripción más técnica, advirtiendo de que siempre la decisión será la del médico.
>
> Ojo, este sistema es para médicos nomás, así que el aviso va en ese tono, y en texto pequeño xs.

> Más breve, para dar más espacio al chat.

**Resultado de la IA:**

- **Botón "Siguiente: …":** se quitó. También se quitaron `onNext` y `nextSectionLabel` del chat y `advanceSection` de `HomeScreen`. Avanzar de sección lo hará el chat de IA cuando esté conectado.
- **Aviso:**
  - primer intento: un párrafo técnico de 4 líneas;
  - después, a pedido de Lucía, una sola línea centrada en `text-xs`: "Uso exclusivo para médicos. La IA es orientativa y puede equivocarse; la decisión clínica es del médico tratante."

**Archivos afectados:** `frontend/components/home/AssistantChat.tsx`, `HomeScreen.tsx`.

**Verificación automática:** `tsc` y `eslint` sin errores. En el recorte de captura, el aviso queda en una línea a 1440 px.

**Revisión humana:** Correcciones de Lucía.

### P-52. Encabezado contraíble y "Paso N de M" en azul

| Campo | Valor |
|---|---|
| Fecha | 2026-11-17 |
| Autor del prompt | Lucía |
| Objetivo | Que el encabezado de la sección ocupe menos espacio |
| Especificación / tarea | T41 |

**Prompts**

> ¿Alguna forma para que la parte esta pueda minimizarse o expandirse, para que no ocupe tanto espacio en el chat? Con animación sutil, nada brusco.

> Elimina esto, esta barra de líneas de estatus o carga naranja. Y "Paso 1 de 8" colócalo de color azul fuerte con texto blanco.

**Resultado de la IA:**

- **Botón de flecha** a la derecha del encabezado:
  - `aria-expanded` y `aria-controls`;
  - etiqueta "Contraer encabezado" o "Expandir encabezado".
- **Encabezado contraído** (de unos 84 px a 58 px):
  - una sola línea;
  - ícono de 36 px;
  - título en `text-lg`;
  - la etiqueta de estado sigue visible.
- **Animación:**
  - la línea "Antecedentes / Paso N de M" se pliega con `Collapsible`, el mismo de los grupos del sidebar;
  - el ícono, los márgenes y el tamaño del título cambian con transiciones de 300 ms;
  - la flecha gira;
  - respeta la preferencia de movimiento reducido.
- **Estado recordado:** `HomeScreen` guarda si el encabezado está contraído, así que se conserva al cambiar de sección.
- **Barra de segmentos:** se quitó la de P-49, junto con `steps`.
- **"Paso N de M":** fondo `#116ee6` (el azul de "Guardar") con texto blanco.

**Archivos afectados:** `frontend/components/home/AssistantChat.tsx`, `HomeScreen.tsx`.

**Verificación automática:** `tsc` y `eslint` sin errores; capturas del encabezado expandido y contraído (el clic se simuló con el protocolo de DevTools).

**Revisión humana:** Pendiente.

### P-53. Encabezado que se oculta por completo y botones de voz y enviar

| Campo | Valor |
|---|---|
| Fecha | 2026-11-17 |
| Autor del prompt | Lucía |
| Objetivo | Ocultar del todo el encabezado de la sección y cambiar los botones de la caja de texto |
| Especificación / tarea | T41 |

**Prompts**

> Me refería a que se pudiera ocultar totalmente o algo así. Que se vaya del todo, no nada más que se haga chiquito.

> Muy bien, ahora en el chat coloca estos iconos para la voz y para enviar.

(Con una imagen: micrófono en un botón blanco con borde y flecha en un botón azul.)

**Resultado de la IA:**

- **Ocultar el encabezado:**
  - P-52 lo compactaba en una línea; Lucía quería ocultarlo por completo.
  - Ahora todo el encabezado va dentro de `Collapsible`: la flecha lo pliega hasta altura 0, con la misma animación del sidebar.
  - Mientras está oculto, una pastilla flotante arriba a la derecha del chat ("⌄ Patológicos") lo vuelve a mostrar. Tiene `aria-expanded` y su texto para el lector de pantalla es "mostrar encabezado de la sección".
  - Se quitaron las transiciones de tamaño del modo compacto.
- **Caja de texto:**
  - nuevo botón de micrófono (`Mic`), blanco con borde y el ícono en azul `#116ee6`, solo visual;
  - el botón de enviar pasa a azul `#116ee6` con flecha (`ArrowRight`); sin texto queda tenue (`opacity-45`) en lugar de gris.
- **Formato:** `AssistantChat.tsx` se formateó con Prettier usando comillas simples y 120 columnas, como el resto del código. Un primer pase con la configuración por defecto había puesto comillas dobles y se corrigió.

**Archivos afectados:** `frontend/components/home/AssistantChat.tsx`.

**Verificación automática:**

- `tsc` y `eslint` sin errores.
- Captura del encabezado oculto (altura 0) con la pastilla visible.
- Captura de la caja de texto con texto escrito, con un paciente temporal `{paciente}` que se quitó después.

**Revisión humana:** Pendiente.

### P-54. Sin botón "Buscar paciente" en el expediente

| Campo | Valor |
|---|---|
| Fecha | 2026-11-17 |
| Autor del prompt | Lucía |
| Objetivo | Quitar el botón repetido del estado vacío del panel derecho |
| Especificación / tarea | T40 |

**Prompt**

> Elimina el botón de "Buscar paciente" aquí. Ya está en el sidebar y en el chat, aquí nomás está repetido.
>
> Deja el ícono y los textos del estado vacío, solo sin el botón.

**Resultado de la IA:**

- El estado vacío del expediente deja solo el ícono, "Sin paciente seleccionado" y "Selecciona un paciente para ver su expediente."
- Se quitó la propiedad `onSearchPatient` de `PatientRecordPanel` y de sus dos usos en `HomeScreen`.
- Buscar paciente sigue disponible en el sidebar y en el saludo del chat.

**Archivos afectados:** `frontend/components/home/PatientRecordPanel.tsx`, `HomeScreen.tsx`.

**Verificación automática:** `tsc` y `eslint` sin errores.

**Revisión humana:** Corrección de Lucía.

### P-55. Banners ilustrados en los hallazgos del expediente

| Campo | Valor |
|---|---|
| Fecha | 2026-11-17 |
| Autor del prompt | Lucía |
| Objetivo | Usar como fondo de las 6 tarjetas de hallazgos los banners que Lucía agregó a `public/` |
| Especificación / tarea | T40 |

**Prompts**

> Coloqué 6 banners, míralos, están en la carpeta public, son imágenes. ¿Es posible reemplazarlos por el fondo actual de estos 6? Que se vean bien y considerablemente, sin perder tamaño bueno o calidad.

> Colócalos con opacidad y algo de blur, pero no tanto a los banners, y que el número en cuestión y su badge salga en la superior derecha, con fondo azul muy oscuro y texto claro.

> O sea ponles más oscuritos con eso de la opacidad los fondos esos banner.

**Resultado de la IA:**

- **Banners usados** (2172×724, unos 1.5 MB cada uno, ilustración a la derecha): `sintomas-`, `signos-`, `estudioslab-`, `diagnosticodif-`, `comorbilidades-` y `complicaciones-banner.png`.
- **Carga de la imagen:**
  - se usa `next/image` con `fill`, `sizes` acorde al ancho de la tarjeta y calidad 90, en lugar de un fondo CSS;
  - Next sirve cada imagen redimensionada y en WebP, sin descargar los 9 MB de los PNG originales;
  - `next.config.ts` agrega `images.qualities: [75, 90]`, que Next 16 exige.
- **Tarjeta:**
  - franja de al menos 96 px con el banner (`object-cover object-right`);
  - título y "Sin registros" en la mitad izquierda, que es la zona libre de la ilustración;
  - los registros, cuando existan, aparecen debajo sobre blanco.
- **Ajustes de Lucía:**
  - los banners al 70 % de opacidad, con desenfoque de 1.5 px y escala 105 % para que el desenfoque no deje los bordes borrosos;
  - el contador en la esquina superior derecha, con fondo `#0b1533` y número blanco.
  - después, a pedido de Lucía ("ponles más oscuritos"), se quitó la opacidad del 70 % y se aplicó `brightness-[0.85]`. "Sin registros" pasó a `text-slate-700` para mantener el contraste.
- Se quitaron los íconos de lucide de estas tarjetas, porque el banner ya ilustra cada tipo.

**Archivos afectados:** `frontend/components/home/PatientRecordPanel.tsx`, `frontend/next.config.ts`.

**Verificación automática:** `tsc` y `eslint` sin errores; capturas del panel con las 6 tarjetas.

**Pendiente:** reiniciar `npm run dev` para que Next lea la nueva lista de calidades. Mientras tanto sirve la calidad 75 y muestra un aviso.

**Revisión humana:** Pendiente.

### P-56. Íconos de color en los hallazgos y más desenfoque en los banners

| Campo | Valor |
|---|---|
| Fecha | 2026-11-17 |
| Autor del prompt | Lucía |
| Objetivo | Identificar cada tipo de hallazgo con un ícono de color y suavizar más los banners |
| Especificación / tarea | T40 |

**Prompts**

> Ponle iconos con fondo de cada color, a Síntomas, Signos y así, a su izquierda, icono y fondo circular pequeños. Cada sección con su color, para distinguirlas rápido.

> Elimínale la opacidad mejor a los banners.

> Pero sí colócales más blur.

> Mucho mucho más blur.

> Y desenfócalo, pero aún con blur, al hacer hover en cada uno.

> Quítale el blur mejor al hacer hover. Que quede nítido.

**Resultado de la IA:**

- **Ícono circular** de 28 px a la izquierda de cada título: ícono blanco de 14 px sobre un color que toma el tono de su banner.

| Tipo | Ícono | Color |
|---|---|---|
| Síntomas | termómetro | `indigo-500` |
| Signos | pulso | `blue-600` |
| Estudios de laboratorio | matraz | `emerald-600` |
| Diagnóstico diferencial | microscopio | `violet-600` |
| Comorbilidades | portapapeles | `orange-500` |
| Complicaciones | alerta | `rose-500` |

- "Sin registros" queda alineado con el título (`pl-9`).
- **Banners:**
  - se quitó el oscurecimiento (`brightness-[0.85]`) de P-55 y vuelven a sus colores originales;
  - el desenfoque subió de 1.5 px a 3 px y luego a **10 px**, con escala de 105 % a **125 %** para que los bordes no se vean borrosos;
  - las ilustraciones quedan como manchas de color suaves detrás del texto.
- **Al pasar el cursor** (`group-hover`):
  - primero el desenfoque bajaba a 3 px;
  - a pedido de Lucía, ahora el banner queda **totalmente nítido** (`blur-none`, `scale-100`);
  - la transición dura 500 ms y respeta la preferencia de movimiento reducido.

**Archivos afectados:** `frontend/components/home/PatientRecordPanel.tsx`.

**Verificación automática:** `tsc` y `eslint` sin errores. Se tomó una captura después de cada ajuste, incluida una con el cursor sobre la tarjeta "Signos", simulado con el protocolo de DevTools.

**Revisión humana:** Ajustes de Lucía.

### P-57. Estado "Sin paciente seleccionado" en gris tenue

| Campo | Valor |
|---|---|
| Fecha | 2026-11-17 |
| Autor del prompt | Lucía |
| Objetivo | Cambiar el estilo del recuadro vacío del expediente |
| Especificación / tarea | T40 |

**Prompts**

> Pon este como grisecito con elementos claros.

> Menos gris el fondo, pero que contraste.

> Sin el border dashed, o podría ser un gris tenue con texto oscuro.

**Resultado de la IA:**

- **Primer intento:** fondo `slate-500` con texto e ícono blancos.
- **Segundo intento:** con un gris más claro, el texto blanco ya no tenía contraste suficiente, así que se invirtió: fondo `slate-200` con texto oscuro.
- **Versión final:**
  - fondo `slate-100` sin borde punteado;
  - el ícono va en un círculo blanco y en `slate-500`;
  - el título en `slate-800` y la descripción en `slate-600`.

**Archivos afectados:** `frontend/components/home/PatientRecordPanel.tsx`.

**Verificación automática:** `tsc` y `eslint` sin errores; captura de cada versión.

**Revisión humana:** Ajustes de Lucía.

### P-58. Desenfoque más fuerte en los banners

| Campo | Valor |
|---|---|
| Fecha | 2026-11-17 |
| Autor del prompt | Lucía |
| Objetivo | Desenfocar mucho más los banners en reposo |
| Especificación / tarea | T40 |

**Prompt**

> Colócale mucho, mucho más blur así normal, sin hover, a los hallazgos banner. O sea en reposo, que se vean bien desenfocados y el hover se quede como está, nítido.

**Resultado de la IA:**

- En reposo, el desenfoque sube de 10 px a **24 px** y la escala de 125 % a **150 %**, para que el desenfoque no aclare los bordes de la tarjeta.
- Al pasar el cursor no cambia nada: el banner sigue nítido (`blur-none`, `scale-100`).

**Archivos afectados:** `frontend/components/home/PatientRecordPanel.tsx`.

**Verificación automática:** `tsc` sin errores; captura de las tarjetas en reposo.

**Revisión humana:** Ajuste de Lucía.

### P-59. Bienvenida guiada del asistente la primera vez

| Campo | Valor |
|---|---|
| Fecha | 2026-11-17 |
| Autor del prompt | Lucía |
| Objetivo | Quitar los mensajes de ejemplo del chat y mostrar un recorrido de bienvenida la primera vez |
| Especificación / tarea | ESP-003, T43 a T45 |

**Prompt**

> Vamos a eliminar todas las respuestas y chats actuales de XpertDiagnostic hasta ahora. En su lugar vamos a crear un "camino" que deberá decir al momento de cargar o de ser la "primera vez" en la página o en la cuenta.
>
> O sea que la primera vez que alguien entra, el asistente lo va guiando con unos mensajes, y ya después el chat queda normal. La primera vez se cuenta por cuenta, no por página.

**Decisiones de Lucía** (preguntadas por la IA):

- "Primera vez" se cuenta por cuenta.
- Recorrido guiado de 3 a 4 pasos.

**Resultado de la IA:**

- **Chat vacío:** se quitaron el saludo, la pregunta por sección, las respuestas rápidas y el botón del saludo anterior.
- **Especificación primero:** `especificaciones/06-bienvenida-asistente.md` (ESP-003) con los casos PT29 a PT34.
- **Pruebas antes del código:** PT29 a PT31 en `DoctorServiceTests.cs`.
- **Base de datos:** columna `USUARIOS.BienvenidaVista` (`BIT NOT NULL DEFAULT 0`) en `CreateDoctorsAndUsersTables.sql`, al crear la tabla y al adaptar una existente. Se aplicó en la base real; los usuarios 1 y 123456 quedan en 0.
- **Backend:**
  - `User.BienvenidaVista`, que también se agrega a `DoctorProfile`;
  - `IDoctorRepository.MarcarBienvenidaVistaAsync`, con `ExecuteUpdateAsync` sin cargar la entidad;
  - `IDoctorService.MarcarBienvenidaVistaAsync`;
  - endpoint `POST /api/doctors/me/welcome`, que responde 204 o 404.
- **Frontend:**
  - `SessionProfile.bienvenidaVista`;
  - ruta `app/api/session/welcome`;
  - `markWelcomeSeen()`, que nunca lanza;
  - `forwardWithSession` devuelve 204 sin cuerpo.
- **`HomeScreen`:**
  - espera el perfil antes de montar el chat;
  - muestra la bienvenida si `bienvenidaVista` es falso (también sin sesión, con `{nombre}`);
  - al pulsar "Acepto" la marca en la cuenta.
- **`AssistantChat`:**
  - 4 pasos (Continuar, Entendido, Acepto, Buscar paciente);
  - cada botón aparece como respuesta del médico y el asistente sigue con el próximo paso;
  - el último abre el buscador;
  - los mensajes entran con un desplazamiento sutil que respeta el movimiento reducido.

**Archivos afectados:**

- `backend/XpertDiagnostic.Api/Models/Entities/User.cs`, `Models/Results/DoctorProfile.cs`, `Repositories/IDoctorRepository.cs`, `Repositories/DoctorRepository.cs`, `Services/Interfaces/IDoctorService.cs`, `Services/DoctorService.cs`, `Controllers/DoctorsController.cs`, `Sql/CreateDoctorsAndUsersTables.sql`;
- `backend/XpertDiagnostic.Tests/DoctorServiceTests.cs`;
- `frontend/types/doctor.ts`, `lib/backendSession.ts`, `services/doctorService.ts`, `app/api/session/welcome/route.ts` (nuevo), `components/home/HomeScreen.tsx`, `components/home/AssistantChat.tsx`;
- `specs/guias/guia-instalacion.md` y `specs/README.md`.

**Verificación automática:**

- `dotnet test`: 26 de 26 pruebas.
- `tsc` y `eslint` sin errores.
- El script se ejecutó dos veces en una base desechable sin errores.
- La API compilada se probó contra una base desechable, que después se borró:
  - `me` devuelve `bienvenidaVista: false`;
  - `POST /me/welcome` responde 204, también al repetirlo;
  - después, `me` devuelve `true`;
  - sin token responde 401.
- Capturas del recorrido: se hizo clic en Continuar, Entendido y Acepto con el protocolo de DevTools.

**Revisión humana:** Pendiente.

### P-60. Asistente "pensando" y escritura con barrido

| Campo | Valor |
|---|---|
| Fecha | 2026-11-17 |
| Autor del prompt | Lucía |
| Objetivo | Hacer más dinámico el recorrido de bienvenida |
| Especificación / tarea | ESP-003, T44 |

**Prompts**

> Vamos a hacer más dinámico el recorrido. Está la animación `loading.svg`, búscala. De preferencia coloca este para simular que la IA de XpertDiagnostic está pensando, y también usaremos una máquina de escribir pero con barrido, así lindo.

> Que sea más pequeño ese loading, y que no tenga fondo ni borde.

> Pero que no sea tan rápido toda la máquina de escribir y así. Las de los LLMs no suelen ser tan rápidas, aparte de que manejan distintos tiempos por burbuja de chat.

**Resultado de la IA:**

- **"Pensando":** antes de cada mensaje del asistente aparecen su avatar y nombre con `public/loading.svg` durante 950 ms.
  - Es un SVG animado con SMIL que se muestra con `next/image` `unoptimized`.
  - Tiene `role="status"` y el texto oculto "XpertDiagnostic está escribiendo".
  - A pedido de Lucía, la animación quedó de 32×8 px, sin fondo ni borde.
- **Nuevo `components/ui/TypewriterText.tsx`:** máquina de escribir con barrido.
  - Las palabras entran una tras otra cada 45 ms, de transparentes y difuminadas (`blur 6px`, `translateY 3px`) a nítidas, en 420 ms.
  - Usa la Web Animations API y anima solo al montarse.
  - El texto completo ocupa su lugar desde el inicio, así que la burbuja no salta.
  - Con movimiento reducido, el texto aparece de inmediato.
- **Ritmo más pausado y variable,** a pedido de Lucía:
  - cada palabra espera en promedio unos 100 ms (antes 45 ms), con una variación aleatoria de ±30 %;
  - pausas extra de 170 ms tras una coma y de 360 ms tras un punto o dos puntos;
  - cada palabra tarda 520 ms en aclararse;
  - cada paso tiene su tiempo de "pensar" (1.3 s, 2.1 s, 1.7 s y 1.0 s) y su ritmo por palabra (105, 85, 125 y 115 ms).
  - Medido en el navegador, cada burbuja tarda en escribirse unos 2.0, 2.9, 2.5 y 1.1 s.
- **`AssistantChat`:**
  - `pendingStep` controla la fase de "pensar";
  - `typedIds` muestra el botón del paso solo cuando el mensaje terminó de escribirse;
  - el desplazamiento al último mensaje ahora es suave.

**Archivos afectados:** `frontend/components/ui/TypewriterText.tsx` (nuevo), `frontend/components/home/AssistantChat.tsx`, `specs/especificaciones/06-bienvenida-asistente.md`.

**Verificación automática:**

- `tsc` y `eslint` sin errores.
- Capturas en cada fase: pensando, a mitad de la escritura, mensaje completo con su botón y la respuesta seguida de "pensando" otra vez. El clic se simuló con el protocolo de DevTools.

**Revisión humana:** Ajuste de Lucía (tamaño del indicador).

### P-61. Burbuja del asistente sin borde y en azul claro

| Campo | Valor |
|---|---|
| Fecha | 2026-11-17 |
| Autor del prompt | Lucía |
| Objetivo | Que las burbujas del asistente se distingan mejor |
| Especificación / tarea | T41 |

**Prompt**

> Coloca sin bordes la burbuja de chat, aparte colócala de otro color, por favor, que contraste muy bien. La burbuja de chat por parte de la AI, la del usuario no.
>
> La del asistente es la que se pierde con el fondo blanco.

**Resultado de la IA:**

- La burbuja del asistente pasa de `bg-slate-50` con borde `slate-100` a `bg-blue-100` sin borde, con texto `slate-900`.
  - Contraste del texto: alrededor de 15:1.
  - Se distingue del fondo blanco y de la burbuja azul marino del médico.
- La burbuja del médico no cambia.

**Archivos afectados:** `frontend/components/home/AssistantChat.tsx`.

**Verificación automática:** `tsc` sin errores; captura del recorrido hasta el paso "Acepto".

**Revisión humana:** Ajuste de Lucía.

### P-62. Explicación detallada del proceso en la bienvenida

| Campo | Valor |
|---|---|
| Fecha | 2026-11-17 |
| Autor del prompt | Lucía |
| Objetivo | Ampliar el paso 2 de la bienvenida |
| Especificación / tarea | ESP-003, T44 |

**Prompt**

> Vamos a explicar esto de forma muy alargada. Explícale lo que pasa con todo eso: "Te guiaré sección por sección: primero los antecedentes y después la evaluación clínica. Con esa información propondré un diagnóstico diferencial."
>
> O sea no nada más una burbuja, sino varias que vayan explicando bien qué se hace en cada parte y para qué, que se entienda el proceso completo.

**Resultado de la IA:**

- **Pasos con varias burbujas:** cada paso de `WELCOME_STEPS` ahora es una lista de burbujas, cada una con su tiempo de "pensar" y su ritmo por palabra.
  - Al terminar de escribirse una burbuja, el asistente "piensa" la siguiente.
  - El botón del paso aparece solo después de la última burbuja.
- **El paso 2 pasa a 5 burbujas** con contenido acorde al sistema:
  - las 8 secciones reales del sidebar;
  - el desbloqueo secuencial;
  - el panel del expediente;
  - la comparación con la base de conocimiento;
  - el diagnóstico diferencial;
  - estudios, plan y seguimiento, que corresponden a las tablas `ESTUDIOS_*`, `TRATAMIENTOS` y `PLANES`.
- **Burbujas agrupadas:** las burbujas seguidas del asistente muestran el avatar y el nombre solo en la primera (`isContinuation`). Los "puntos de pensar" de una continuación tampoco repiten la cabecera.

**Archivos afectados:** `frontend/components/home/AssistantChat.tsx`, `specs/especificaciones/06-bienvenida-asistente.md`.

**Verificación automática:**

- `tsc` y `eslint` sin errores.
- Recorrido en el navegador con el protocolo de DevTools: "Entendido" aparece a los 31 s de pulsar "Continuar", tras las 5 burbujas, y nunca antes.
- Capturas antes y después de agrupar las burbujas.

**Revisión humana:** Pendiente.

### P-63. Franja negra otra vez bajo la pantalla principal

| Campo | Valor |
|---|---|
| Fecha | 2026-11-17 |
| Autor del prompt | Lucía |
| Objetivo | Quitar de nuevo el espacio negro al final de `/home` |
| Especificación / tarea | T41 |

**Prompt**

> De nuevo apareció ese margen negro, quítalo. Sale abajo cuando avanza la bienvenida y se puede bajar la página, y no debería.

**Causa:**

- Al hacer ocultable el encabezado del chat (P-53), el área con scroll quedó dentro de un contenedor nuevo, y `relative` se quedó en el contenedor exterior, que no recorta su contenido.
- Los textos `sr-only` de los mensajes ("Tú:" y "XpertDiagnostic está escribiendo") usan `position: absolute`, así que se posicionaban fuera del área con scroll.
- La página crecía conforme avanzaba la bienvenida: de 508 a 642 px en una ventana de 508 px. Mismo tipo de error que P-45.

**Corrección:**

- `relative` en el área con scroll del chat.
- **Resguardo:** la raíz de `HomeScreen` pasa de `min-h-dvh` a `h-dvh overflow-hidden`. La pantalla principal mide siempre la ventana y nada interno puede volver a alargar la página.

**Archivos afectados:** `frontend/components/home/AssistantChat.tsx`, `HomeScreen.tsx`.

**Verificación automática:**

- `tsc` y `eslint` sin errores.
- Se midió con el protocolo de DevTools a 1365×600, 1440×900 y 420×800, en tres momentos: al cargar, con el sidebar contraído y tras avanzar la bienvenida. En todos, la página mide lo mismo que la ventana.

**Revisión humana:** Error detectado por Lucía.

### P-64. Burbujas duplicadas en la bienvenida (clave repetida)

| Campo | Valor |
|---|---|
| Fecha | 2026-11-17 |
| Autor del prompt | Lucía |
| Objetivo | Corregir el error de consola "Encountered two children with the same key, `welcome-1-2`" |
| Especificación / tarea | ESP-003, T44 |

**Prompt**

> Ayuda, dice [error de Next.js: dos elementos con la misma key `welcome-1-2` en `AssistantChat.tsx`]. Aparecen burbujas repetidas cuando guardo el archivo a mitad de la bienvenida.

**Causa:**

- En desarrollo, React vuelve a ejecutar los efectos de los componentes ya montados (Fast Refresh al guardar archivos, Strict Mode).
- `TypewriterText` volvía a animar los mensajes ya escritos y avisaba otra vez que había terminado.
- El chat entonces encolaba de nuevo la burbuja siguiente y la publicaba dos veces.

**Corrección, con tres protecciones:**

1. `TypewriterText` recuerda si ya terminó (`isDoneRef`): no reanima ni vuelve a avisar.
2. `AssistantChat` avanza una sola vez por burbuja (`advancedIdsRef`).
3. Al publicar una burbuja, se omite si su `id` ya está en la conversación.

**Archivos afectados:** `frontend/components/ui/TypewriterText.tsx`, `frontend/components/home/AssistantChat.tsx`.

**Verificación automática:**

- `tsc` y `eslint` sin errores.
- Recorrido en el navegador con dos Fast Refresh forzados a mitad de las burbujas (se volvió a guardar el archivo sin cambios).
- Resultado: 6 burbujas del asistente (saludo y las 5 del paso 2), sin duplicados y sin errores en consola, revisada con `Runtime.consoleAPICalled`.

**Revisión humana:** Error detectado por Lucía.

---

Si quieres, puedo hacer lo mismo con los campos de **Resultado de la IA** o **Verificación automática** para que también queden más redactados, o dejar los prompts aún más largos en las entradas que más te importen.
### P-65. La bienvenida espera el primer mensaje; portada del chat vacío

| Campo | Valor |
|---|---|
| Fecha | 2026-11-17 |
| Autor del prompt | Lucía |
| Objetivo | Que el chat no salude solo: el médico escribe primero y entonces arranca la bienvenida. Mientras el chat está vacío, mostrar una portada decorativa que invite a escribir. |
| Especificación / tarea | ESP-003, T46 |

**Prompt**

> En vez de empezar con "Hola, Médico Prueba. Soy XpertDiagnostic, tu asistente de apoyo clínico." directamente, permitámosle al usuario escribir en el chat y después de lo que escriba se empiece a activar. Pero si el chat está inactivo y el usuario no ha enviado un mensaje, que aparezca una leyenda invitando a escribir, linda y decorativa [captura de referencia: saludo grande, logo y sugerencias en botones].

**Resultado de la IA:**

- La bienvenida ya no arranca al montar el chat: arranca cuando el médico envía su primer mensaje. Ese mensaje se puede escribir aunque todavía no haya paciente; después el cuadro vuelve a bloquearse hasta elegir uno.
- Con el chat vacío se muestra `ChatIntro`: logo, título grande y subtítulo. Tiene tres variantes:
  - Bienvenida pendiente: "¿Qué vamos a revisar hoy, {nombre}?" (cambiado en P-67).
  - Sin paciente y bienvenida ya vista: "Hola de nuevo, {nombre}".
  - Con paciente: "¿Qué observaste en {sección}?"
- Fondo decorativo: cruces médicas en SVG estático, en azul y verde agua muy claros, sin animación ni desenfoque (por A-10).
- Nueva prop `doctorName` en `AssistantChat`.

**Archivos afectados:** `frontend/components/home/AssistantChat.tsx`, `frontend/components/home/HomeScreen.tsx`.

**Verificación automática:** `tsc` y `eslint` sin errores.

**Revisión humana:** Lucía pidió quitar las sugerencias en botones que tenía la primera versión de la portada (ver A-12).

### P-66. Saltos de línea en la portada del chat

| Campo | Valor |
|---|---|
| Fecha | 2026-11-17 |
| Autor del prompt | Lucía |
| Objetivo | Que el título y el subtítulo de la portada no se vean tan alargados |
| Especificación / tarea | ESP-003, T46 |

**Prompt**

> Se ve muy alargado ese texto, dale saltos de línea sutiles [captura: "¿Qué vamos a revisar hoy, Medico Prueba?" en una sola línea].

**Resultado de la IA:** el título y el subtítulo de `ChatIntro` se parten en dos líneas en un punto natural (por ejemplo, "¿Qué vamos a revisar hoy, / {nombre}?"). En pantallas pequeñas el salto se omite y el texto se acomoda solo. El interlineado del subtítulo es un poco más amplio.

**Archivos afectados:** `frontend/components/home/AssistantChat.tsx`.

**Verificación automática:** `tsc` y `eslint` sin errores.

**Revisión humana:** Corrección visual pedida por Lucía.

### P-67. Título más grande y texto neutral en la portada de bienvenida

| Campo | Valor |
|---|---|
| Fecha | 2026-11-17 |
| Autor del prompt | Lucía |
| Objetivo | Agrandar el título de la portada y cambiar "¿Qué vamos a revisar hoy?", que daba a entender que el asistente ya comprendía el chat y el recorrido |
| Especificación / tarea | ESP-003, T46 |

**Prompt**

> Pon más gigante el "qué vamos a revisar hoy" y pon otro texto, no ese de "qué vamos a revisar", es que se oye como si ya estuviera capacitado para entender el chat y el recorrido.

**Resultado de la IA:**

- Título de la bienvenida pendiente: "Te damos la bienvenida a / XpertDiagnostic". Subtítulo: "Hola, {nombre}. / Envía un mensaje para comenzar."
- El título crece en todas las variantes de la portada: `text-4xl`, `sm:text-5xl` y `lg:text-6xl`. El subtítulo pasa a `sm:text-xl`.

**Archivos afectados:** `frontend/components/home/AssistantChat.tsx`.

**Verificación automática:** `tsc` y `eslint` sin errores.

**Revisión humana:** Corrección de texto y tamaño pedida por Lucía.

### P-68. El subtítulo de la portada invita a escribir en el chat

| Campo | Valor |
|---|---|
| Fecha | 2026-11-17 |
| Autor del prompt | Lucía |
| Objetivo | Que el subtítulo invite a escribir en el chat, que se habilita antes de la bienvenida (P-65) |
| Especificación / tarea | ESP-003, T46 |

**Prompt**

> Pero que se pueda escribir en el chat, como te mencioné anteriormente, o que invite ese subtítulo.

**Resultado de la IA:**

- Subtítulo de la bienvenida pendiente: "Hola, {nombre}. / Escríbeme en el chat de abajo para comenzar."
- Mientras la bienvenida espera el primer mensaje, el cuadro de texto recibe el foco al cargar, así que el cursor queda listo para escribir.

**Archivos afectados:** `frontend/components/home/AssistantChat.tsx`.

**Verificación automática:** `tsc` y `eslint` sin errores.

**Revisión humana:** Corrección de texto pedida por Lucía.

### P-69. El recorrido de bienvenida avanza con lo que escribe el médico

| Campo | Valor |
|---|---|
| Fecha | 2026-11-17 |
| Autor del prompt | Lucía |
| Objetivo | Que el médico pueda escribir durante todo el recorrido y que cada respuesta escrita muestre el paso siguiente |
| Especificación / tarea | ESP-003, T46 |

**Prompt**

> O sea, la idea es que se pueda escribir y vaya mostrando lo del recorrido después de escribir.

**Resultado de la IA:**

- Cuando el asistente termina la última burbuja de un paso, el cuadro de texto se habilita. Lo que el médico escriba aparece como su mensaje y el asistente pasa al paso siguiente.
- Los botones (Continuar, Entendido, Acepto) siguen como atajo. Si el médico escribe, el botón desaparece.
- Responder por escrito al aviso clínico cuenta como aceptarlo: marca la bienvenida como vista, igual que "Acepto".
- El último paso ("Para empezar, selecciona un paciente") se resuelve con el botón "Buscar paciente". Sin paciente, el cuadro vuelve a bloquearse ahí.
- Mientras el asistente piensa o escribe, el cuadro se bloquea con el texto "XpertDiagnostic está escribiendo…". Al terminar, el cursor vuelve solo al cuadro y el texto de ayuda dice "Escribe tu respuesta para continuar…".

**Archivos afectados:** `frontend/components/home/AssistantChat.tsx`.

**Verificación automática:** `tsc` y `eslint` sin errores.

**Revisión humana:** Aclaración de comportamiento pedida por Lucía.

### P-70. Se puede escribir sin paciente aunque la bienvenida ya se haya visto

| Campo | Valor |
|---|---|
| Fecha | 2026-11-17 |
| Autor del prompt | Lucía |
| Objetivo | Que el chat deje escribir aunque la cuenta ya haya visto la bienvenida y no haya paciente |
| Especificación / tarea | ESP-003, T46 |

**Prompt**

> Me sale abajo "Selecciona un paciente", no deja escribir [captura: portada "Hola de nuevo, Medico Prueba" con el cuadro de texto bloqueado].

**Causa:** la cuenta de prueba ya había visto la bienvenida (`BienvenidaVista = 1`). Sin paciente, el chat solo dejaba escribir para arrancar la bienvenida, así que el cuadro quedaba bloqueado.

**Resultado de la IA:**

- Sin paciente y con la bienvenida ya vista, el médico puede escribir su primer mensaje. El asistente responde con el último paso de la bienvenida: "Para empezar, selecciona un paciente.", con el botón "Buscar paciente".
- Subtítulo de esa portada: "Escríbeme en el chat o selecciona / un paciente para empezar."
- Con el chat vacío ya no se baja automáticamente al final, así que la portada se ve completa desde arriba. Antes el logo quedaba cortado.

**Archivos afectados:** `frontend/components/home/AssistantChat.tsx`.

**Verificación automática:** `tsc` y `eslint` sin errores.

**Revisión humana:** Error detectado por Lucía.

### P-71. El recorrido de bienvenida se muestra siempre

| Campo | Valor |
|---|---|
| Fecha | 2026-11-17 |
| Autor del prompt | Lucía |
| Objetivo | Que escribir en el chat arranque siempre el recorrido, aunque la cuenta ya lo haya visto, sin el recordatorio "Para empezar, selecciona un paciente" de P-70 |
| Especificación / tarea | ESP-003, T46 |

**Prompt**

> Pero estaría bien que eso de escribir y el recorrido siempre pasara, aunque ya lo haya visto. O sea, no quiero eso de "para empezar, selecciona un paciente".

**Resultado de la IA:**

- Sin paciente, el primer mensaje del médico arranca siempre el recorrido completo. Ya no depende de `USUARIOS.BienvenidaVista`.
- Se quitaron la portada "Hola de nuevo" y el recordatorio de P-70. Sin paciente se ve siempre "Te damos la bienvenida a XpertDiagnostic".
- `AssistantChat` ya no recibe `welcomeName` y usa `doctorName` para el saludo. `HomeScreen` ya no calcula `showWelcome`.
- Aceptar el aviso clínico se sigue guardando con `POST /api/doctors/me/welcome`, como registro de la aceptación.
- Con paciente seleccionado, el chat sigue siendo el de captura, sin recorrido.

**Archivos afectados:** `frontend/components/home/AssistantChat.tsx`, `frontend/components/home/HomeScreen.tsx`.

**Verificación automática:** `tsc` y `eslint` sin errores.

**Revisión humana:** Lucía rechazó el recordatorio de P-70 (ver A-13).

### P-72. La animación de entrada del login a veces se quedaba detenida

| Campo | Valor |
|---|---|
| Fecha | 2026-11-17 |
| Autor del prompt | Lucía |
| Objetivo | Que la animación de entrada del login no se quede en el texto "XpertDiagnostic" sin avanzar al fondo y al formulario |
| Especificación / tarea | Inicio de sesión |

**Prompt**

> Hay veces que se queda pegado y no avanza a los demás efectos, aquí, hay que solucionar eso [captura: pantalla blanca con "XpertDiagnostic" en texto oscuro].

**Diagnóstico:**

- En la captura, el título sigue oscuro: ni siquiera se ejecutó la primera etapa (fondo a los 2.2 s).
- Las letras se animan con CSS desde que se pinta la página. Las etapas siguientes dependían de temporizadores que solo empiezan cuando React termina de cargar (hidratación). Si React tarda, por ejemplo mientras el servidor de desarrollo compila, la pantalla queda con las letras quietas y la cuenta de 2.2 s y 4.2 s empieza de cero recién entonces.
- No se pudo reproducir: tres cargas en Edge sin interfaz avanzaron con normalidad.

**Resultado de la IA:** los tiempos de cada etapa se miden desde que empezó, en pantalla, la animación de las letras, con `getAnimations()` y `document.timeline`, y no desde que cargó React. Si React llega tarde, el fondo y el formulario aparecen enseguida. Si el navegador no expone las animaciones, se usa la cuenta anterior.

**Archivos afectados:** `frontend/app/(auth)/login/page.tsx`.

**Verificación automática:**

- `tsc` y `eslint` sin errores.
- Edge sin interfaz: a 1.5 s el formulario sigue oculto (`inert`); a 8 s el título ya es blanco y el formulario está visible.

**Revisión humana:** Error detectado por Lucía. Pendiente confirmar que no vuelve a ocurrir.

### P-73. Redirección de "/" a "/login" movida a next.config.ts

| Campo | Valor |
|---|---|
| Fecha | 2026-11-17 |
| Autor del prompt | Lucía |
| Objetivo | Quitar el error de la consola del servidor de desarrollo al entrar a "/" |
| Especificación / tarea | Inicio de sesión |

**Prompt**

> Decía [registro de `next dev`: `Error: Route "/": Could not validate instant because an error prevented the target segment from rendering`, causado por `NEXT_REDIRECT` en `app/page.tsx:4`].

**Causa:** `app/page.tsx` redirigía al login con `redirect()` dentro de la página. Con `cacheComponents` y `partialPrefetching` activos, Next 16 valida en desarrollo que cada ruta pueda mostrarse al instante. El `redirect()` interrumpe el renderizado de la página y la validación falla.

**Resultado de la IA:**

- Se eliminó `app/page.tsx`.
- La redirección temporal (307) de "/" a "/login" ahora está en `redirects()` de `next.config.ts`. Next la aplica antes de renderizar cualquier página.
- Se regeneraron los tipos de rutas (`npx next typegen`), porque `.next/types` seguía apuntando a la página eliminada.

**Archivos afectados:** `frontend/next.config.ts`, `frontend/app/page.tsx` (eliminado).

**Verificación automática:**

- `curl http://localhost:3000/` responde 307 hacia `/login`.
- `tsc` y `eslint` sin errores.

**Revisión humana:** Lucía compartió el registro del servidor.

### P-74. Etiqueta "Cédula profesional" en el login de médico

| Campo | Valor |
|---|---|
| Fecha | 2026-11-17 |
| Autor del prompt | Lucía |
| Objetivo | Cambiar el texto "ID médico" por "Cédula profesional" en el login |
| Especificación / tarea | Inicio de sesión |

**Prompt**

> Cambia lo de ID médico a Cédula profesional en el login.

**Aclaración:** la IA advirtió que el login de médico usa el número `IdUSUARIO` (= `IdMEDICO`) y no `MEDICOS.CedulaProfesional`. Lucía decidió que siga siendo con el ID médico y que solo cambie el texto.

**Resultado de la IA:** en el modo médico, la etiqueta y el texto de ayuda del campo dicen "Cédula profesional". La validación (número entero) y el backend no cambian. El modo administrador sigue con "ID administrador".

**Archivos afectados:** `frontend/components/auth/LoginForm.tsx`.

**Verificación automática:** `tsc` y `eslint` sin errores.

**Revisión humana:** Lucía revirtió el cambio y la etiqueta volvió a "ID médico" (ver A-14).

### P-75. Barra superior y expediente plegables, cada uno con su estilo

| Campo | Valor |
|---|---|
| Fecha | 2026-11-17 |
| Autor del prompt | Lucía |
| Objetivo | Que la barra superior y el panel derecho del expediente se puedan plegar, cada uno a su manera y con un diseño original |
| Especificación / tarea | Pantalla principal, T47 |

**Prompt**

> ¿Puedes hacer que el topbar y el menú derecho de expediente igual sean colapsables, pero cada uno a su manera y originales?

**Resultado de la IA:**

- **Barra superior, como persiana.** Un botón con flecha hacia arriba, a la derecha del menú de cuenta, la sube. Queda una franja azul delgada con una lengüeta al centro que dice {nombre}; al pulsarla, la barra vuelve a bajar. Se animan la altura, entre dos valores fijos, y el desplazamiento. Solo se pliega en pantallas grandes (`lg`), porque en móvil la barra tiene el botón del menú.
- **Expediente, como lomo de libro.** El botón del encabezado lo pliega a 4rem. El lomo muestra el título "Expediente · {paciente}" en vertical, los seis íconos de hallazgos con su número y el avance de la captura como barra vertical que se llena de abajo hacia arriba. Todo el lomo es un botón para volver a abrirlo.
- **Fluidez (por A-10).** Solo cambia el ancho de la columna. El contenido completo conserva su ancho y se desliza hacia el borde con `translate` y `opacity`, así que no se reacomoda en cada fotograma.
- **Corrección incluida.** La barra superior no recorta el menú de cuenta, que es flotante.

**Archivos afectados:** `frontend/components/home/TopNavbar.tsx`, `frontend/components/home/PatientRecordPanel.tsx`, `frontend/components/home/HomeScreen.tsx`.

**Verificación automática:**

- `tsc` y `eslint` sin errores.
- Edge sin interfaz a 1440×900, controlado con un script: capturas en estado normal, plegado y vuelto a abrir. Sin errores en la consola.

**Revisión humana:** Pendiente de revisión visual por Lucía.

### P-76. Botón para plegar la barra superior distinto de la flecha del menú de cuenta

| Campo | Valor |
|---|---|
| Fecha | 2026-11-17 |
| Autor del prompt | Lucía |
| Objetivo | Evitar la confusión entre dos flechas seguidas en la barra superior |
| Especificación / tarea | Pantalla principal, T47 |

**Prompt**

> Se confunde porque hay 2 flechas [captura: la flecha del menú de cuenta junto a la flecha de plegar la barra].

**Resultado de la IA:**

- El botón para plegar la barra usa el ícono `PanelTopClose` (un panel con la franja superior), ya no una flecha.
- Lo separa del menú de cuenta una línea divisoria.
- Al pasar el cursor muestra "Ocultar barra superior".
- La lengüeta de la barra plegada usa el ícono complementario `PanelTopOpen`.

**Archivos afectados:** `frontend/components/home/TopNavbar.tsx`.

**Verificación automática:** `tsc` y `eslint` sin errores.

**Revisión humana:** Error de diseño detectado por Lucía.

### P-77. Posición inicial de la conversación

| Campo | Valor |
|---|---|
| Fecha | 2026-11-17 |
| Autor del prompt | Lucía |
| Objetivo | Que el inicio del chat no se vea pegado arriba, sobre todo con la barra superior y el encabezado plegados |
| Especificación / tarea | Pantalla principal, T47 |

**Prompt**

> Siento que se ve muy arriba el inicio del chat [captura: el primer mensaje casi pegado al borde superior, bajo la lengüeta y el botón "Patológicos"].

**Resultado de la IA:**

1. Primera propuesta: apilar los mensajes desde abajo, junto al cuadro de texto. Lucía la rechazó: "Ahora se ve muy abajo, anticuado" (ver A-15).
2. Versión final: la conversación vuelve a empezar arriba, con un margen superior amplio que se adapta al alto de la ventana (`clamp(4.5rem, 12vh, 7rem)`). El primer mensaje queda debajo del botón del encabezado y de la lengüeta de la barra superior, sin quedar pegado al borde.

**Archivos afectados:** `frontend/components/home/AssistantChat.tsx`.

**Verificación automática:**

- `tsc` y `eslint` sin errores.
- Edge sin interfaz a 1360×594, con las barras plegadas y el mensaje "hola" enviado: el primer mensaje empieza a 72 px del borde, debajo del botón "Patológicos". Sin errores en la consola.

**Revisión humana:** Corrección de diseño pedida por Lucía.

### P-78. Colores del chat del asistente y de los botones de la bienvenida

| Campo | Valor |
|---|---|
| Fecha | 2026-11-17 |
| Autor del prompt | Lucía |
| Objetivo | Burbujas del asistente en azul fuerte con texto blanco y otro color para los botones de los pasos (Continuar, Entendido, etc.) |
| Especificación / tarea | ESP-003, T46 |

**Prompt**

> Coloca el color de chat un azul fuerte oscuro, pero no tan oscuro, al de XpertDiagnostic, que contraste con texto blanco, y también otro color para los botones de continuación como Continuar, etc.
>
> (Seguimiento) Un poquitín más oscuro ese azul del chat de XpertDiagnostic.

**Resultado de la IA:**

- Burbujas del asistente: de `bg-blue-100` con texto oscuro a `bg-blue-800` (#1e40af) con texto blanco, con contraste de 8.7:1. Primero se probó `blue-700`; Lucía pidió un tono un poco más oscuro. Sigue siendo más claro que el azul marino de los mensajes del médico (#0b1533) y que la barra superior (`blue-900`).
- Botones de los pasos (Continuar, Entendido, Acepto, Buscar paciente): de azul marino con texto blanco a verde cyan (`teal-400`) con texto negro y `teal-300` al pasar el cursor. Es el mismo acento del avatar del médico y de las etiquetas `accent`.

**Archivos afectados:** `frontend/components/home/AssistantChat.tsx`.

**Verificación automática:**

- `tsc` y `eslint` sin errores.
- Captura en Edge sin interfaz a 1360×594 con la burbuja de saludo y el botón "Continuar". Sin errores en la consola.

**Revisión humana:** Lucía eligió el tono del azul.

### P-79. Cuadro de texto y aviso del chat más visibles; enlace "Más información"

| Campo | Valor |
|---|---|
| Fecha | 2026-11-17 |
| Autor del prompt | Lucía |
| Objetivo | Que el cuadro de texto del chat (sobre todo bloqueado) y el aviso de abajo no se vean tan tenues, y agregar "Más información" al final del aviso |
| Especificación / tarea | Pantalla principal |

**Prompt**

> Vamos a cambiar el color de esto también a más visible, se ve muy tenue [captura: cuadro bloqueado con "Selecciona un paciente para comenzar"]. Y a este texto, al final, vamos a colocarle "Más información" subrayado y con cursor pointer [captura: aviso "Uso exclusivo para médicos…"].

**Resultado de la IA:**

- **Cuadro de texto.**
  - Borde `slate-200` → `slate-300`.
  - Texto de ayuda `slate-400` → `slate-600`.
  - Botón de dictado bloqueado: ícono `slate-300` → `slate-500` y borde `slate-300`.
  - Botón de enviar bloqueado: opacidad 45 % → 70 %.
- **Aviso.** `text-xs slate-500` → `text-sm slate-700`.
- **Enlace.** Al final del aviso va un botón "Más información", subrayado, con `cursor-pointer` y que se pone azul al pasar el cursor. Por ahora es solo visual: todavía no hay página o diálogo de información.

**Archivos afectados:** `frontend/components/home/AssistantChat.tsx`.

**Verificación automática:**

- `tsc` y `eslint` sin errores.
- Captura en Edge sin interfaz a 1360×594 con el cuadro bloqueado mientras el asistente escribe. Sin errores en la consola.

**Revisión humana:** Corrección visual pedida por Lucía.

### P-80. Cuadro de texto hasta abajo y aviso fijo encima

| Campo | Valor |
|---|---|
| Fecha | 2026-11-17 |
| Autor del prompt | Lucía |
| Objetivo | Poner el cuadro de texto hasta abajo y el aviso fijo justo encima, sin que se encime con la conversación |
| Especificación / tarea | Pantalla principal |

**Prompt**

> ¿No podemos colocar la barra de chat hasta abajo y la info arribita, fija, pero sin chocar con el chat de arriba?

**Resultado de la IA:**

- En la zona de redacción, el aviso "Uso exclusivo para médicos… Más información" va primero y el cuadro de texto después, pegado al borde inferior.
- Ambos están dentro de la zona fija, debajo de la línea divisoria. La conversación hace scroll por encima y nunca queda tapada.
- Relleno de la zona: `pt-4 pb-4` → `pt-3 pb-3`. Separación entre aviso y cuadro: `mb-2.5`.

**Archivos afectados:** `frontend/components/home/AssistantChat.tsx`.

**Verificación automática:**

- `tsc` y `eslint` sin errores.
- Captura en Edge sin interfaz a 1360×594. Sin errores en la consola.

**Revisión humana:** Corrección de diseño pedida por Lucía.

### P-81. Aviso al final de la conversación, sin divisor, con margen

| Campo | Valor |
|---|---|
| Fecha | 2026-11-17 |
| Autor del prompt | Lucía |
| Objetivo | Que el aviso no sea fijo y aparezca siempre al final de la conversación, sin la línea divisoria; con margen suficiente para que nada se vea junto |
| Especificación / tarea | Pantalla principal |

**Prompt**

> Estaría bien que no sea fija y esa info siempre aparezca al final, para no estar con eso del divisor.
>
> (Seguimiento) Pero dejar margen, pues; por ejemplo, aquí se ve muy junto en el chat [captura: la portada recortada arriba y el aviso pegado al subtítulo].

**Resultado de la IA:**

- El aviso "Uso exclusivo para médicos… Más información" salió de la zona fija y quedó al final del área con scroll: después del último mensaje o de la portada. Se desplaza con la conversación.
- La zona de redacción ya no tiene divisor (`border-t-2`); solo queda el cuadro de texto abajo.
- Cuando hay pocos mensajes, la conversación ocupa el espacio libre y el aviso queda abajo. Cuando hay muchos, aparece después del último mensaje.
- Margen: el aviso lleva `pt-6 pb-5`.
- Corrección de la portada: con `overflow-hidden` y `flex-1`, se encogía por debajo de su contenido en ventanas bajas y quedaba recortada. Ahora usa `flex-[1_0_auto]`: llena el espacio, pero nunca mide menos que su contenido. Si no cabe, se hace scroll.

**Archivos afectados:** `frontend/components/home/AssistantChat.tsx`.

**Verificación automática:**

- `tsc` y `eslint` sin errores.
- Capturas en Edge sin interfaz a 1360×594 de la portada (completa, con scroll) y de la conversación (aviso abajo, separado). Sin errores en la consola.

**Revisión humana:** Corrección de diseño pedida por Lucía.

### P-82. Aviso del chat en letra más pequeña

| Campo | Valor |
|---|---|
| Fecha | 2026-11-17 |
| Autor del prompt | Lucía |
| Objetivo | Reducir el tamaño del aviso "Uso exclusivo para médicos… Más información" |
| Especificación / tarea | Pantalla principal |

**Prompt**

> Un poco más pequeño todo este texto: "Uso exclusivo para médicos. La IA es orientativa y puede equivocarse; la decisión clínica es del médico tratante. Más información".

**Resultado de la IA:** el aviso y el enlace pasan de `text-sm` a `text-xs`. Conserva el color `slate-700` de P-79, así que se sigue leyendo bien.

**Archivos afectados:** `frontend/components/home/AssistantChat.tsx`.

**Verificación automática:** `eslint` sin errores.

**Revisión humana:** Corrección visual pedida por Lucía.

### P-83. Botón para detener al asistente mientras escribe

| Campo | Valor |
|---|---|
| Fecha | 2026-11-17 |
| Autor del prompt | Lucía |
| Objetivo | Cambiar la flecha de enviar por un ícono de detener mientras la IA escribe, para poder pararla |
| Especificación / tarea | ESP-003, T46 |

**Prompt**

> ¿Podemos poner un ícono de stop en vez de la flecha cuando la IA esté escribiendo? Esto con el fin de detenerla o pararla.

**Resultado de la IA:**

- Mientras el asistente piensa o escribe, el botón de enviar se cambia por "Detener respuesta": un cuadrado relleno sobre azul marino.
- **Si está pensando,** no publica la burbuja.
- **Si está escribiendo,** la burbuja se corta en la palabra actual: las palabras que ya empezaron se completan y las demás no aparecen. Debajo se muestra "Respuesta detenida". Si no alcanzó a aparecer ninguna palabra, la burbuja se quita.
- **Al detenerse,** el cuadro de texto se habilita con "Escribe tu respuesta para continuar…". El siguiente mensaje retoma el recorrido desde la burbuja pendiente. Si se detuvo la última burbuja de un paso, queda su botón (por ejemplo, "Continuar") y responder avanza como siempre.
- `TypewriterText` recibe `stopped` y `onStopped(textoVisible)`. Al detenerse ya no llama a `onDone`.

**Archivos afectados:** `frontend/components/home/AssistantChat.tsx`, `frontend/components/ui/TypewriterText.tsx`.

**Verificación automática:**

- `tsc` y `eslint` sin errores.
- Edge sin interfaz, controlado con un script:
  1. Detener a medio escribir el saludo: queda "Hola, {nombre}." con "Respuesta detenida" y el botón "Continuar".
  2. Detener mientras piensa: el cuadro se habilita para continuar.
  3. Mandar otro mensaje: retoma el paso 2 y vuelve a mostrar el botón de detener.
- Sin errores en la consola.

**Revisión humana:** Pendiente de revisión por Lucía.

### P-84. Chat del asistente centralizado en su propia carpeta, por capas

| Campo | Valor |
|---|---|
| Fecha | 2026-11-17 |
| Autor del prompt | Lucía |
| Objetivo | Mover todo lo del chat de IA a una carpeta centralizada, siguiendo los patrones acordados |
| Especificación / tarea | R-ARQ-01, R-ARQ-04, R-ARQ-05, R-ARQ-07; plan 01 |

**Prompt**

> ¿Podemos dedicar o mover todo lo referente al chat de IA de XpertDiagnostic a una carpeta centralizada para esta, siguiendo los patrones de diseño que habíamos acordado?

**Resultado de la IA:** `components/home/AssistantChat.tsx` (unas 680 líneas con todo mezclado) se dividió por capas (R-ARQ-01), igual que el login:

- **Tipos (`types/assistant.ts`):** `ChatMessage`, `WelcomeBubble`, `WelcomeStep`, `TourPosition` (antes `PendingBubble`) y `ChatIntroMode`.
- **Modelo (`lib/welcomeTour.ts`):** el guion `WELCOME_STEPS`, las constantes de los pasos y las reglas puras `welcomeMessage`, `isContinuation`, `isLastBubble`, `thinkingTime`, `nextBubble`, `nextStep` y `TOUR_START`. Tiene contratos `@pre`/`@post` (R-ARQ-05) y no depende de React.
- **Vista (`components/assistant/`), una responsabilidad por archivo (R-ARQ-04):**
  - `AssistantChat.tsx`: contenedor. Guarda el estado y decide si se puede escribir, enviar o detener.
  - `SectionHeader.tsx`: encabezado de la sección y botón para volver a mostrarlo.
  - `ChatIntro.tsx`: portada y cruces decorativas.
  - `ChatMessages.tsx`: burbuja del asistente, mensaje del médico e indicador de "pensando".
  - `ChatComposer.tsx`: cuadro de texto, dictado y enviar o detener.
  - `ChatNotice.tsx`: aviso y "Más información".
  - `TypewriterText.tsx`: se movió desde `components/ui/`, porque solo lo usa el chat.
  - `styles.ts`: anillo de foco compartido.
- `HomeScreen` importa ahora `@/components/assistant/AssistantChat`. Los nombres de carpetas y archivos van en inglés (R-ARQ-07).
- Se agregaron las filas del chat a las tablas de capas y de contratos del plan 01.
- Sin cambios de comportamiento: la lógica de estado se copió tal cual.

**Fuera del alcance:**

- `clinicalSections.ts` se queda en `components/home/`, porque también lo usan la barra lateral y el expediente.
- `markWelcomeSeen` se queda en `services/doctorService.ts`, porque llama a un endpoint de médicos.

**Archivos afectados:** `frontend/components/assistant/*` (nuevos), `frontend/types/assistant.ts` (nuevo), `frontend/lib/welcomeTour.ts` (nuevo), `frontend/components/home/HomeScreen.tsx`, `frontend/components/home/AssistantChat.tsx` (eliminado), `frontend/components/ui/TypewriterText.tsx` (movido), `specs/planes/01-arquitectura-y-patrones.md`.

**Verificación automática:**

- `tsc` y `eslint` sin errores.
- Se repitió en Edge sin interfaz la prueba de P-83: arrancar la bienvenida, detener mientras escribe, detener mientras piensa y retomar. Mismo resultado y sin errores en la consola.

**Revisión humana:** Pendiente de revisión por Lucía.

### P-85. Azul de las burbujas del asistente un poco menos fuerte

| Campo | Valor |
|---|---|
| Fecha | 2026-11-17 |
| Autor del prompt | Lucía |
| Objetivo | Suavizar un poco el azul de las burbujas del asistente sin perder intensidad |
| Especificación / tarea | ESP-003 |

**Prompt**

> Pon el color de chat un azul un poquitito menos fuerte, pero sí [fuerte].

**Resultado de la IA:** las burbujas del asistente pasan de `blue-800` (#1e40af) a #1e47c5. Es un tono intermedio entre `blue-700`, que Lucía había visto demasiado claro en P-78, y `blue-800`. El contraste con el texto blanco es de 7.6:1 y cumple el nivel AAA.

**Archivos afectados:** `frontend/components/assistant/ChatMessages.tsx`.

**Verificación automática:** `eslint` sin errores; contraste calculado con la fórmula de luminancia de WCAG.

**Revisión humana:** Lucía eligió el tono.

### P-86. Conversación más ancha y burbujas con más aire

| Campo | Valor |
|---|---|
| Fecha | 2026-11-17 |
| Autor del prompt | Lucía |
| Objetivo | Que el chat (mensajes, cuadro de texto) se vea más alargado y menos compacto |
| Especificación / tarea | Pantalla principal |

**Prompt**

> ¿Es posible que podamos hacer más alargado el chat? Me refiero a los mensajes y así, no tan compacto.
>
> (Seguimiento) No tan alargado.

**Resultado de la IA:**

- Ancho de la columna del chat (conversación, portada, aviso y cuadro de texto): `max-w-3xl` (768 px) → `max-w-4xl` (896 px). Primero se probó `max-w-5xl` (1024 px) y Lucía lo vio demasiado ancho.
- Burbujas: ancho máximo de 85 % → 88 %, relleno `px-4 py-3` → `px-5 py-3.5`.

**Archivos afectados:** `frontend/components/assistant/AssistantChat.tsx`, `ChatComposer.tsx`, `ChatIntro.tsx`, `ChatNotice.tsx`, `ChatMessages.tsx`.

**Verificación automática:**

- `eslint` sin errores.
- Captura en Edge sin interfaz a 1600×800 con las barras plegadas. Sin errores en la consola.

**Revisión humana:** Lucía ajustó el ancho.

### P-87. Hora de envío al final de cada grupo de mensajes

| Campo | Valor |
|---|---|
| Fecha | 2026-11-17 |
| Autor del prompt | Lucía |
| Objetivo | Mostrar la hora de envío de los mensajes del médico y del asistente; si hay varios seguidos del mismo autor, solo al final del último |
| Especificación / tarea | ESP-003 |

**Prompt**

> ¿Es posible colocarle la hora en que se envía cada mensaje, tanto receptor como emisor? Pero si son varios mensajes de cada uno, que se muestre al final del último.

**Resultado de la IA:**

- `ChatMessage` tiene un campo nuevo, `sentAt` (ms). Lo llenan:
  - el mensaje del médico;
  - la respuesta con botón (por ejemplo, "Continuar");
  - cada burbuja del asistente, con la hora en que se publica: `welcomeMessage(posición, nombre, sentAt)`.
- Regla del modelo `endsGroup(mensaje, autorSiguiente)` en `lib/welcomeTour.ts`: la hora va solo bajo el último mensaje de un grupo seguido del mismo autor. El asistente "pensando" cuenta como el siguiente mensaje del asistente, así que la hora baja a la nueva burbuja cuando llega.
- Formato corto en español de México con `Intl.DateTimeFormat('es-MX')`, por ejemplo "4:18 p.m.", dentro de un `<time dateTime>`.
- Ubicación: bajo la burbuja, alineada a la izquierda (asistente) o a la derecha (médico). Si la burbuja se detuvo, se muestra junto a la hora: "4:18 p.m. · Respuesta detenida".

**Archivos afectados:** `frontend/types/assistant.ts`, `frontend/lib/welcomeTour.ts`, `frontend/components/assistant/AssistantChat.tsx`, `frontend/components/assistant/ChatMessages.tsx`.

**Verificación automática:**

- `tsc` y `eslint` sin errores.
- Edge sin interfaz: "hola", el saludo, "Continuar" y el grupo de explicaciones dan 4 horas. Las burbujas anteriores del grupo no la llevan. Sin errores en la consola.

**Revisión humana:** Pendiente de revisión por Lucía.

### P-88. Error "Invalid time value" al mostrar la hora de mensajes antiguos

| Campo | Valor |
|---|---|
| Fecha | 2026-11-17 |
| Autor del prompt | Lucía |
| Objetivo | Corregir el error `RangeError: Invalid time value` en `MessageMeta` |
| Especificación / tarea | P-87 |

**Prompt**

> Dice: [error de Next.js: `Runtime RangeError: Invalid time value` en `Date.toISOString`, `components/assistant/ChatMessages.tsx:39`].

**Causa:** la conversación estaba abierta mientras se agregaba la hora (P-87). Fast Refresh conservó el estado de React con mensajes creados antes de que existiera `sentAt`. Con `sentAt` indefinido, `new Date(undefined).toISOString()` lanza el error.

**Corrección:** `MessageMeta` comprueba `Number.isFinite(sentAt)`. Sin una hora válida, omite la hora y conserva la nota "Respuesta detenida" si la hay. En el uso normal todos los mensajes nuevos llevan `sentAt`.

**Archivos afectados:** `frontend/components/assistant/ChatMessages.tsx`.

**Verificación automática:** `tsc` y `eslint` sin errores.

**Revisión humana:** Error detectado por Lucía.

### P-89. La hora del asistente aparece cuando termina de responder

| Campo | Valor |
|---|---|
| Fecha | 2026-11-17 |
| Autor del prompt | Lucía |
| Objetivo | Que la hora del asistente no se vea mientras piensa o escribe, sino solo cuando terminó de responder, para que no se encime con la animación de carga |
| Especificación / tarea | P-87 |

**Prompt**

> Pero que al final; me refería después de que haya dejado de responder, para que no choque con el loading.

**Resultado de la IA:** la hora de un mensaje del asistente se muestra solo si cierra su grupo (`endsGroup`) y si su burbuja ya terminó de escribirse. Mientras el asistente piensa o escribe dentro de un grupo, no hay hora. Al terminar la última burbuja, la hora aparece bajo ella y antes del botón del paso. Los mensajes del médico no cambian.

**Archivos afectados:** `frontend/components/assistant/AssistantChat.tsx`.

**Verificación automática:**

- `tsc` y `eslint` sin errores.
- Edge sin interfaz: a mitad del paso 2 hay 3 horas y ninguna en el grupo en curso. Al terminar el paso hay 4, la última bajo la quinta burbuja y antes de "Entendido". Sin errores en la consola.

**Revisión humana:** Aclaración de Lucía sobre P-87.

### P-90. Reintentar una respuesta detenida del asistente

| Campo | Valor |
|---|---|
| Fecha | 2026-11-17 |
| Autor del prompt | Lucía |
| Objetivo | Si se detiene un mensaje de XpertDiagnostic, ofrecer un ícono para reintentar el mensaje |
| Especificación / tarea | ESP-003, P-83 |

**Prompt**

> ¿Es posible hacer algo para que, si el mensaje de chat de XpertDiagnostic se detiene, poner un ícono así UX/UI que dé la opción de reintentar enviar el mensaje de nuevo?

**Resultado de la IA:**

- Junto a "Respuesta detenida" aparece el botón "↻ Reintentar" (`RotateCcw`, en el azul de las burbujas), con `aria-label` y `title` "Reintentar respuesta".
- Al pulsarlo, la burbuja cortada se quita y el asistente vuelve a "pensar" y escribe el mensaje completo desde el principio. Mientras tanto se puede volver a detener.
- Solo se ofrece en el último mensaje de la conversación y cuando el asistente no está ocupado, para no desordenar la conversación.
- Si la respuesta se detuvo mientras el asistente pensaba, no hay burbuja que reintentar. En ese caso sigue valiendo escribir para retomar (P-83).

**Archivos afectados:** `frontend/components/assistant/AssistantChat.tsx`, `frontend/components/assistant/ChatMessages.tsx`.

**Verificación automática:**

- `tsc` y `eslint` sin errores.
- Edge sin interfaz:
  1. Detener el saludo: aparece "Reintentar".
  2. Pulsarlo: el asistente vuelve a pensar, con el botón de detener activo.
  3. Al final queda el saludo completo, sin la nota "Respuesta detenida" y con "Continuar".
- Sin errores en la consola.

**Revisión humana:** Pendiente de revisión por Lucía.

### P-91. Logo del asistente más grande y sin borde circular

| Campo | Valor |
|---|---|
| Fecha | 2026-11-17 |
| Autor del prompt | Lucía |
| Objetivo | Agrandar el ícono de XpertDiagnostic junto a sus mensajes y quitarle el borde circular |
| Especificación / tarea | ESP-003 |

**Prompt**

> Pon el ícono de XpertDiagnostic un poco más grande, sin borde circular.

**Resultado de la IA:** el avatar del asistente ya no tiene círculo, borde (`rounded-full border-2`) ni fondo. El logo pasa de 22 px a 32 px dentro del mismo espacio de 36 px, así que las burbujas seguidas siguen alineadas. También aplica al indicador de "pensando".

**Archivos afectados:** `frontend/components/assistant/ChatMessages.tsx`.

**Verificación automática:**

- `eslint` sin errores.
- Captura en Edge sin interfaz a 1600×800. Sin errores en la consola.

**Revisión humana:** Corrección visual pedida por Lucía.

### P-92. Corte diagonal decorativo en la barra superior

| Campo | Valor |
|---|---|
| Fecha | 2026-11-17 |
| Autor del prompt | Lucía |
| Objetivo | Un efecto decorativo en la barra superior: desde la mitad, el lado derecho en un azul un poco más claro, separado por un borde diagonal invertido |
| Especificación / tarea | Pantalla principal, T47 |

**Prompt**

> Vamos a hacer como un efecto lindo: al topbar, más o menos a la mitad, ponle una diagonal invertida o algo así; no literalmente ponerle una diagonal, pero el caso es así. Y que rellenes con un azul más clarito, pero no tanto, el lado derecho de esa diagonal.

**Resultado de la IA:**

- Capa decorativa (`aria-hidden`) detrás del contenido de la barra, en `bg-blue-800` sobre el `bg-blue-900` de la barra.
- La forma se hace con `clip-path: polygon(46% 0, 100% 0, 100% 100%, 54% 100%)`: un corte inclinado como "\" que empieza a mitad de la barra.
- Es estática, sin animación ni desenfoque, para no afectar la fluidez (A-10). Al plegar la barra (P-75), la capa se encoge con ella y queda también en la franja delgada.

**Archivos afectados:** `frontend/components/home/TopNavbar.tsx`.

**Verificación automática:**

- `eslint` sin errores.
- Captura en Edge sin interfaz a 1440×900. Sin errores en la consola.

**Revisión humana:** Pendiente de revisión visual por Lucía.

### P-93. Jerarquía visual de los botones de los pasos

| Campo | Valor |
|---|---|
| Fecha | 2026-11-17 |
| Autor del prompt | Lucía |
| Objetivo | Dar una jerarquía visual y una experiencia más claras a los botones de la bienvenida (Continuar, Entendido, Acepto, Buscar paciente) |
| Especificación / tarea | ESP-003 |

**Prompt**

> Al botón Continuar y así, esos botones, hay que darles una jerarquía visual más clara y UX/UI.

**Resultado de la IA:** nuevo componente `StepAction` en `ChatMessages.tsx`:

- **Acción principal.** Botón más grande que antes:
  - forma: `min-h-11`, `px-5 py-2.5`, `rounded-xl`;
  - texto: `font-semibold`, `text-base`;
  - interacción: se aclara a `teal-300` al pasar el cursor y baja 1 px al pulsarlo (`active:translate-y-px`), sin sombras;
  - separación de la hora del mensaje con `mt-4`.
- **Ícono según la intención:**

  | Botón | Ícono | Posición |
  |---|---|---|
  | Continuar, Entendido | flecha → | al final; se desliza un poco al pasar el cursor |
  | Acepto | escudo con palomita (aceptar el aviso clínico) | al inicio |
  | Buscar paciente | lupa | al inicio |

- **Pista secundaria.** Al lado, en gris pequeño: "o escríbeme tu respuesta". Recuerda que también se puede avanzar escribiendo (P-69). No aparece en "Buscar paciente", que solo se resuelve con el botón.

**Archivos afectados:** `frontend/components/assistant/ChatMessages.tsx`.

**Verificación automática:**

- `tsc` y `eslint` sin errores.
- Captura en Edge sin interfaz a 1600×800 con "Continuar →". Sin errores en la consola.

**Revisión humana:** Lucía pidió quitar la pista "o escríbeme tu respuesta" (ver A-16).

### P-94. Acentos verde cyan en el login

| Campo | Valor |
|---|---|
| Fecha | 2026-11-17 |
| Autor del prompt | Lucía |
| Objetivo | Usar el verde cyan en el login para respetar la paleta de la pantalla principal |
| Especificación / tarea | Inicio de sesión |

**Prompt**

> En el login también podrías usar elementos en verde cyan para respetar la paleta de colores que llevamos hasta ahora [captura del login con el botón "Entrar" en índigo].

**Resultado de la IA:** el índigo, que no era de la paleta, se cambió por verde cyan (`teal`):

- **Botón "Entrar":** de `#4c589c` con texto blanco y sombra a `teal-400` con texto negro en negrita, `teal-300` al pasar el cursor y sin sombra. Es igual a las acciones principales del chat (P-78, P-93).
- **Foco de los campos:** borde `teal-500` y anillo `teal-500/40`. Los estados de error (rojo) y de campo válido (verde) no cambian.
- **Selector Médico/Administrador y botón de mostrar contraseña:** anillo de foco `teal-500`.
- **Casilla "Recuérdame la sesión":** `accent-teal-500`.
- **Enlaces "Términos y privacidad" y "Recuperar contraseña":** al pasar el cursor, texto `teal-700` y subrayado `teal-500`.
- **Sin cambio:** el selector activo sigue en el azul `#116ee6`, para que el verde cyan quede reservado a la acción principal.

**Archivos afectados:** `frontend/components/auth/LoginForm.tsx`.

**Verificación automática:**

- `eslint` sin errores; no queda ninguna clase `indigo`.
- Captura del login en Edge sin interfaz a 1440×900. Sin errores en la consola.

**Revisión humana:** Pendiente de revisión visual por Lucía.

### P-95. Botón "Entrar" en verde cyan oscuro con texto blanco

| Campo | Valor |
|---|---|
| Fecha | 2026-11-17 |
| Autor del prompt | Lucía |
| Objetivo | Oscurecer el verde cyan del botón "Entrar" para que contraste con texto blanco |
| Especificación / tarea | Inicio de sesión, P-94 |

**Prompt**

> Más oscuro ese color para poder contrastar con texto blanco.

**Resultado de la IA:** el botón "Entrar" pasa de `teal-400` con texto negro a `teal-700` (#0f766e) con texto blanco, y a `teal-800` al pasar el cursor. El contraste con el blanco es de 5.5:1 en reposo (AA) y de 7.6:1 al pasar el cursor (AAA). Los botones de los pasos del chat no cambian.

**Archivos afectados:** `frontend/components/auth/LoginForm.tsx`.

**Verificación automática:** `eslint` sin errores; contrastes calculados con la fórmula de luminancia de WCAG.

**Revisión humana:** Corrección de color pedida por Lucía.

### P-96. Formato de chat (negritas y listas) en el recorrido

| Campo | Valor |
|---|---|
| Fecha | 2026-11-17 |
| Autor del prompt | Lucía |
| Objetivo | Dar formato de chat a las burbujas del paso 2 de la bienvenida para que no se vean tan secas |
| Especificación / tarea | ESP-003 (burbujas 2.1 a 2.5) |

**Prompt**

> ¿Podrías añadir estilos de chat en estas partes del recorrido? [las 5 burbujas del paso 2] … para que no se vea tan seco.

**Resultado de la IA:**

- **Formato mínimo (`lib/chatMarkup.ts`, modelo):**
  - `**texto**` para negritas;
  - las líneas que empiezan con `- ` son viñetas;
  - el resto son párrafos.

  `parseChatMarkup` devuelve bloques de palabras, con contratos `@pre`/`@post`. No interpreta HTML, así que el texto nunca se inyecta como marcado. Registra si había espacio antes de cada palabra, para que "**negrita**." no separe el punto.
- **Vista (`components/assistant/ChatMarkup.tsx`):**
  - párrafos separados;
  - listas con viñetas en `teal-300`;
  - negritas en `font-semibold text-teal-200` sobre el azul de la burbuja.
- **`TypewriterText`:** anima las palabras de ese formato. Hace una pausa extra de 260 ms al terminar cada párrafo o viñeta. Al detenerse informa cuántas palabras aparecieron (`visibleWords`). El mensaje conserva su texto completo y la burbuja detenida muestra solo esas palabras, con el formato intacto. Reintentar (P-90) sigue igual.
- **Guion del paso 2, mismo contenido con formato:**
  - 2.1: negritas en "dos etapas" y "en orden, una sección a la vez".
  - 2.2: "**1. Antecedentes**" con sus cinco secciones en viñetas.
  - 2.3: "**2. Evaluación clínica**" con sus tres secciones en viñetas.
  - 2.4: negritas en "se desbloquea al completar la anterior", "barra lateral" y "expediente".
  - 2.5: "diagnóstico diferencial" en negrita y lo que se sugiere en viñetas.

**Archivos afectados:** `frontend/lib/chatMarkup.ts` (nuevo), `frontend/components/assistant/ChatMarkup.tsx` (nuevo), `frontend/components/assistant/TypewriterText.tsx`, `frontend/components/assistant/ChatMessages.tsx`, `frontend/components/assistant/AssistantChat.tsx`, `frontend/types/assistant.ts`, `frontend/lib/welcomeTour.ts`.

**Verificación automática:**

- `tsc` y `eslint` sin errores.
- Pruebas del intérprete con `tsx`: puntuación pegada a la negrita, viñetas, texto plano y texto vacío.
- Edge sin interfaz:
  - capturas del paso 2 completo con negritas y viñetas;
  - se repitió la prueba de detener y reintentar.
- Sin errores en la consola.

**Revisión humana:** Lucía revisó las capturas. Antes de entregar se corrigió un error de la propia IA: la puntuación quedaba separada de las negritas.

### P-97. "Asistente clínico" como insignia

| Campo | Valor |
|---|---|
| Fecha | 2026-11-17 |
| Autor del prompt | Lucía |
| Objetivo | Mostrar el rol del asistente como insignia junto a su nombre, sin el "·" |
| Especificación / tarea | ESP-003 |

**Prompt**

> Esto de "· Asistente clínico" mejor pongámoslo como un badge, sin el "·".

**Resultado de la IA:** sobre las burbujas del asistente, "XpertDiagnostic" va seguido de la insignia "Asistente clínico" (`rounded-md bg-blue-100 text-sm`), sin separador. Lucía pidió después el texto oscuro, pero no azul: `text-slate-800`. También aplica al indicador de "pensando".

**Archivos afectados:** `frontend/components/assistant/ChatMessages.tsx`.

**Verificación automática:**

- `eslint` sin errores.
- Captura en Edge sin interfaz. Sin errores en la consola.

**Revisión humana:** Corrección visual pedida por Lucía.

### P-98. Animación continua en la etiqueta "Pendiente"

| Campo | Valor |
|---|---|
| Fecha | 2026-11-17 |
| Autor del prompt | Lucía |
| Objetivo | Darle a la etiqueta "Pendiente" una animación continua, suave y sutil, como una alerta discreta |
| Especificación / tarea | Pantalla principal |

**Prompt**

> ¿Puedes poner lo de "Pendiente" como un fade suave, como alertita suave, linda y sutil? O sea, animación continua.
>
> (Seguimiento) Casi no se ve, pero estaría bien ponerlo como un movimiento de dispersión, como de shapes en el fondo de "Pendiente", pero todas naranjosas. Continuo.

**Resultado de la IA:**

1. **Primera versión:** una capa `orange-200` que aparecía y se desvanecía (`status-breathe`). Lucía la vio casi invisible.
2. **Versión final:** `PendingParticles` en `SectionHeader.tsx`. Son seis círculos naranjas (`orange-200`, `orange-300` y `orange-400`, de 6 a 12 px) detrás del texto, recortados por la etiqueta.
   - Cada uno nace en su punto, crece, se aleja en su propia dirección (`--dx`, `--dy`) y se desvanece, en bucle continuo (`status-particle` en `globals.css`).
   - Duraciones de 2.6 a 3.6 s con retrasos negativos, así que el movimiento ya está en marcha al cargar y nunca se sincroniza.
   - Solo animan `transform` y `opacity`, sin recalcular el diseño (A-10). Con "reducir movimiento" no se muestran.
   - Solo aparece cuando la sección está "Pendiente" (`in-progress`).

**Incidencia del entorno:** Turbopack no reprocesó el `@theme` de `globals.css` tras el primer cambio y la clase `animate-*` nueva no se generaba. Se resolvió con un segundo cambio de contenido en `globals.css`. Ocurrió en las dos versiones.

**Archivos afectados:** `frontend/app/globals.css`, `frontend/components/assistant/SectionHeader.tsx`.

**Verificación automática:**

- `tsc` y `eslint` sin errores.
- Edge sin interfaz:
  - `document.getAnimations()` muestra las 6 animaciones `status-particle` en estado `running`;
  - capturas ampliadas de la etiqueta en tres momentos distintos.
- Sin errores en la consola.

**Ajuste (seguimiento: "mi idea era lo más blur posible"):**

- La capa de las figuras lleva `blur-md`. El desenfoque se aplica una sola vez a esa capa, que mide lo mismo que la etiqueta (unos 130×34 px), así que el costo es mínimo, a diferencia del fondo aurora de pantalla completa (A-10).
- Para que el color no se pierda con el desenfoque, las figuras crecieron a 18-28 px y pasaron a `orange-400`, `orange-500` y `amber-400`.
- Resultado: manchas de luz naranja suaves que se mueven detrás del texto, que sigue legible.
- Verificado en Edge sin interfaz: 6 animaciones en estado `running` y capturas ampliadas en tres momentos. Sin errores en la consola.

- Seguimiento ("no tan naranjoso, pero sí visible"): se suavizaron los tonos a `orange-300`, `orange-400` y `amber-300`, alternados, con los mismos tamaños y el mismo desenfoque. Las manchas siguen visibles, en un naranja durazno más ligero. Verificado con capturas ampliadas en Edge sin interfaz.

**Revisión humana:** Lucía ajustó la visibilidad, el desenfoque y el tono en tres vueltas.

### P-99. Registrar un paciente nuevo (formulario guiado por el chat)

| Campo | Valor |
|---|---|
| Fecha | 2026-11-17 |
| Autor del prompt | Lucía |
| Objetivo | Definir e implementar, solo en la interfaz, cómo se agrega un paciente nuevo y cómo lo explica el recorrido |
| Especificación / tarea | ESP-004 (nueva), T48 a T50 |

**Prompt**

> Aún sin agregar la lógica, pero hace falta algo: ¿cómo será lo de agregar un nuevo paciente, o lo de crearlo, botones, etc., y cómo será explicado en el recorrido?
>
> (Tras la propuesta) Me gusta el texto del recorrido, pero no sé si también sea bueno eso de "Nuevo paciente" y cómo se implementaría, si mediante la IA o mediante un formulario. ¿Tú qué dices?
>
> (Tras la recomendación) ¡Vayamos a eso!

**Resultado de la IA:**

- **Recomendación aceptada:** un formulario, y que la IA solo guíe hacia él. Los motivos están en ESP-004, sección 2.
- **Modelo:** `PATIENT_LIMITS` en `types/patient.ts`, igual que la tabla `PACIENTES`. En `lib/newPatient.ts`, `validateNewPatient`, `nextPatientId` y `createPatient`, con contratos.
- **Vista:** `NewPatientDialog.tsx`. Pide nombre completo y edad, muestra los errores junto al campo y lleva el foco al primero con error. Indica que el ID se asigna solo. El botón "Registrar y comenzar" es `teal-700` con texto blanco.
- **Entradas:**
  - barra lateral: "Nuevo paciente", secundaria con borde;
  - buscador: botón destacado sin resultados y enlace al pie con resultados;
  - último paso del recorrido: texto nuevo con formato y botones "Buscar paciente" y "Nuevo paciente". `WelcomeStep` admite `secondaryAction`.
- **`HomeScreen`:** guarda los pacientes en estado (en memoria). Al registrar, el paciente se selecciona y la captura empieza en la primera sección.

**Error de la propia IA corregido antes de entregar:** `nextPatientId` usaba ``new RegExp(`^PACIE(\d+)$`)``. Dentro de un template string, `\d` se convierte en "d", así que siempre devolvía `PACIE00001`. La prueba con `tsx` lo detectó y se cambió por una expresión regular literal.

**Archivos afectados:** `frontend/types/patient.ts`, `frontend/lib/newPatient.ts` (nuevo), `frontend/components/home/NewPatientDialog.tsx` (nuevo), `HomeScreen.tsx`, `Sidebar.tsx`, `PatientSearchDialog.tsx`, `frontend/types/assistant.ts`, `frontend/lib/welcomeTour.ts`, `frontend/components/assistant/ChatMessages.tsx`, `frontend/components/assistant/AssistantChat.tsx`, `specs/especificaciones/07-nuevo-paciente.md` (nuevo), `specs/especificaciones/06-bienvenida-asistente.md`.

**Verificación automática:**

- `tsc` y `eslint` sin errores.
- PT35 a PT39 con `tsx`.
- PT40 en Edge sin interfaz. Sin errores en la consola.

**Revisión humana:** Lucía eligió el texto del recorrido y aprobó el enfoque de formulario.

### P-100. Ajustes tras probar el alta: nombre con letras, portada clara y lomo sin nombre

| Campo | Valor |
|---|---|
| Fecha | 2026-11-17 |
| Autor del prompt | Lucía |
| Objetivo | Aclarar la pantalla que aparece al registrar un paciente y corregir lo que se veía mal en el lomo del expediente |
| Especificación / tarea | ESP-004 |

**Prompts**

> ¿A qué se debe esta pantalla al registrar un nuevo paciente con el formulario? No entendí muy bien [captura: "¿Qué observaste en patológicos? Paciente: 111."].
>
> De preferencia evita poner el paciente en la barra lateral derecha minimizada, porque se corta. Puse de ejemplo 111 de nombre y no quiero que se vea el nombre ni nada; únicamente al expandir está bien.
>
> Solo aparecen 5 y son 6, soluciónalo, los íconos con fondo circular.

**Resultado de la IA:**

- **Nombre con letras.** El formulario aceptaba "111". Ahora el nombre necesita al menos una letra y no admite números (`\p{L}` y `\d`). "María José Núñez" y "O'Connor-Pérez" siguen siendo válidos.
- **Portada con paciente.** Antes decía "¿Qué observaste en patológicos? / Paciente: 111.". Ahora dice "Empecemos con antecedentes: / Patológicos", o "Sigamos con…" en las secciones siguientes, y debajo "Expediente de {nombre}. / Escribe en el chat lo que sepas del paciente sobre esta sección.".
- **Lomo del expediente.** Ya no muestra el nombre del paciente; solo "Expediente".
- **Los 6 íconos del lomo.** Antes la columna de íconos se encogía y recortaba el sexto en ventanas bajas. Ahora los íconos no se encogen (28 px) y la barra de avance vertical es la que se adapta al alto disponible (24 a 96 px).
- **Ventana en pantallas bajas.** La ventana "Nuevo paciente" tiene un alto máximo igual a la pantalla y hace scroll, para que sus botones no se corten a 594 px de alto.

**Archivos afectados:** `frontend/lib/newPatient.ts`, `frontend/components/assistant/ChatIntro.tsx`, `frontend/components/assistant/AssistantChat.tsx`, `frontend/components/home/PatientRecordPanel.tsx`, `frontend/components/home/NewPatientDialog.tsx`.

**Verificación automática:**

- `tsc` y `eslint` sin errores.
- PT37 con `tsx`.
- Edge sin interfaz a 1360×594:
  - "111" muestra el error;
  - el alta válida selecciona al paciente;
  - el lomo muestra 6 de 6 íconos completos y ningún nombre.
- Sin errores en la consola.

**Revisión humana:** errores detectados por Lucía al probar.

### P-101. Paciente de la sesión en una píldora fija

| Campo | Valor |
|---|---|
| Fecha | 2026-11-17 |
| Autor del prompt | Lucía |
| Objetivo | Mostrar de forma fija de qué paciente es la sesión, en lugar de "Expediente de {nombre}" en la portada |
| Especificación / tarea | ESP-004 (RF-33) |

**Prompts**

> En vez de colocar "Expediente de hola", directamente coloca algo fijo donde sí le quede, para saber de qué paciente es la sesión.
>
> (Tras ponerlo en el encabezado de la sección) Fuera de esa barra decía yo.
>
> (Eligió entre tres opciones: píldora flotante en el chat, barra superior o junto al cuadro de texto) Píldora flotante en el chat.
>
> Pero más distinguible esa píldora, no sé, diferente fondo, un fondo oscuro y contraste o algo.

**Resultado de la IA:**

- **Primera versión, rechazada:** una etiqueta dentro del encabezado de la sección (ver A-19).
- **Versión final:** `SessionPatientPill.tsx`.
  - Píldora fija arriba a la izquierda del área de conversación, frente al botón "Patológicos" de la derecha.
  - No se desplaza con el chat y sigue visible con el encabezado oculto.
  - Fondo azul marino (`#0b1533`), nombre en blanco y en negrita, número de expediente en `slate-300` y avatar verde cyan. Lleva `title` con el nombre completo y "Paciente de la sesión:" para lector de pantalla.
- **Portada:** se quitó "Expediente de {nombre}". Queda "Escribe en el chat lo que sepas del paciente / sobre esta sección.", con más margen arriba (`pt-16`) para no chocar con la píldora.

**Archivos afectados:** `frontend/components/assistant/SessionPatientPill.tsx` (nuevo), `frontend/components/assistant/AssistantChat.tsx`, `frontend/components/assistant/ChatIntro.tsx`, `frontend/components/assistant/SectionHeader.tsx` (se retiró la etiqueta).

**Verificación automática:**

- `tsc` y `eslint` sin errores.
- Capturas en Edge sin interfaz a 1360×594, con el encabezado abierto y oculto. Sin errores en la consola.

**Revisión humana:** Lucía eligió la ubicación y pidió más contraste.

### P-102. Conexión de datos antes de la máquina de inferencia: pacientes y catálogos

| Campo | Valor |
|---|---|
| Fecha | 2026-11-18 |
| Autor del prompt | Lucía |
| Objetivo | Ir conectando de forma coherente la estructura visual y la lógica antes de tener la máquina de inferencia o el RAG |
| Especificación / tarea | ESP-004, T50 a T54 |

**Prompt**

> ¿Crees que sea buena idea ir conectando coherente y lógicamente, siguiendo la estructura visual tanto como la estructura lógica, sin aún haber puesto la máquina de inferencia o el RAG para que la IA comience a responder como un LLM? Me están comentando que: [mensajes de Axel: `PACIENTES` es una tabla de entrada y salida; la entrada es el paciente, signos, síntomas y comorbilidades; las demás columnas son el resultado de la máquina de inferencia].
>
> (Tras la propuesta de 6 pasos) Muy bien, vamos con todo eso, en marcha.

**Resultado de la IA:**

- **Criterio.** Un sistema experto razona con IDs del catálogo, no con texto libre. Por eso la captura debe ser estructurada (elegir del catálogo), y el LLM o RAG queda para redactar y explicar.
- **Paso 1, pacientes en la base de datos.**
  - Backend: `GET /api/patients` devuelve la lista con el nombre del diagnóstico. `POST /api/patients` asigna el `IdPaciente` en el servidor, reintenta si otro médico tomó el mismo ID y guarda solo nombre y edad.
  - Frontend: ruta `app/api/patients` y `patientService`. El buscador carga los pacientes reales al iniciar sesión y cada vez que se abre. La ventana muestra el error del servidor sin cerrarse y dice "Registrando…" mientras guarda.
  - Se quitaron `nextPatientId` y `createPatient` del frontend: el ID es responsabilidad exclusiva del servidor.
- **Paso 2, catálogos de solo lectura.** `GET /api/catalogs/{nombre}` para síntomas, signos, estudios de laboratorio, comorbilidades y enfermedades.
  - Cada catálogo tiene una consulta fija; el nombre de la URL solo elige entre ellas, así que nada externo llega al SQL.
  - La ruta de Next rechaza nombres desconocidos (404) sin llamar a la API.
  - En el frontend se agregaron `catalogService` y `types/catalog.ts`.
- **Hallazgos en los datos del equipo:**
  - `PACIENTES` ya tiene 10 pacientes ficticios con sus hallazgos.
  - Los catálogos pertenecen a cada enfermedad, así que hay descripciones repetidas con distinto ID: 18 en `SINTOMAS`, 5 en `SIGNOS` y 3 en `COMORBILIDADES`.
  - Las secciones de antecedentes patológicos, no patológicos, alergias y quirúrgicos no tienen tabla.
  - Se consultará a Axel antes del paso 3.

**Archivos afectados:**

- Backend: `Patient.cs`, `Disease.cs`, `CreatePatientRequest.cs`, `PatientSummary.cs`, `CatalogItem.cs`, `IPatientRepository.cs`, `PatientRepository.cs`, `ICatalogRepository.cs`, `CatalogRepository.cs`, `IPatientService.cs`, `PatientService.cs`, `ICatalogService.cs`, `CatalogService.cs`, `PatientsController.cs`, `CatalogsController.cs`, `AppDbContext.cs`, `Program.cs`, `PatientServiceTests.cs` y `ClinicalDataIntegrationTests.cs`.
- Frontend: `app/api/patients/route.ts`, `app/api/catalogs/[name]/route.ts`, `services/patientService.ts`, `services/catalogService.ts`, `types/catalog.ts`, `types/patient.ts`, `lib/newPatient.ts`, `HomeScreen.tsx` y `NewPatientDialog.tsx`.

**Verificación automática:**

- `dotnet build` sin advertencias.
- `dotnet test --filter "Categoria!=Integracion"`: 46 pruebas correctas.
- Integración de solo lectura contra la base real (PT47 y PT48): 6 pruebas correctas.
- `tsc` y `eslint` sin errores.
- HTTP sin sesión: la API responde 401 en los endpoints nuevos. Next responde 401, 404 para un catálogo desconocido y 400 para el nombre "111".
- Edge sin interfaz: registrar sin sesión muestra "Tu sesión terminó…" y la ventana no se cierra. Sin errores en la consola.

**Revisión humana:** pendiente. El registro con sesión iniciada no se pudo probar sin credenciales.

### P-103. Captura estructurada, avance real y análisis con la máquina de inferencia provisional

| Campo | Valor |
|---|---|
| Fecha | 2026-11-18 |
| Autor del prompt | Lucía |
| Objetivo | Pasos 3 a 5 del plan de P-102: capturar por sección desde los catálogos, avanzar entre secciones y analizar con una máquina de inferencia intercambiable |
| Especificación / tarea | ESP-005 (nueva), T52 a T57 |

**Prompt**

> Muy bien, vamos con todo eso, en marcha.
>
> (Decisiones de Lucía ante tres preguntas de la IA) Guardar todos los IDs de una descripción repetida; alinear las secciones con el modelo; guardar varias comorbilidades en `HALLAZGOS_PACIENTE`.

**Resultado de la IA:**

- **Backend:**
  - `PatientRecordController` con `GET record`, `PUT findings/{seccion}`, `PUT preexisting-disease` y `POST analysis`.
  - `PatientRecordService`: expande cada elección a todos sus IDs equivalentes, valida contra el catálogo, guarda la medición con sus unidades y agrupa al leer.
  - `PatientRecordRepository`: reemplaza los hallazgos de un tipo en una transacción y lee la descripción con una consulta parametrizada.
  - `IInferenceEngine` con `ProvisionalInferenceEngine` y `DiagnosisService`.
- **Frontend:**
  - Rutas `app/api/patients/[id]/…`, que validan la forma del ID, la sección y los hallazgos antes de llamar a la API.
  - `recordService`, `lib/recordRules.ts` (opciones sin repetir, búsqueda sin acentos, mediciones con coma o punto) y `types/record.ts`.
  - `SectionCapture`: catálogo con búsqueda, elegidos con valor y unidades, y "Guardar y continuar" o "Continuar sin…".
  - `DiagnosisPanel`: candidatos con porcentaje, criterios y apoyos, y la etiqueta "Motor provisional".
- **Secciones (`clinicalSections.ts`):** ahora son Enfermedades preexistentes, Comorbilidades, Síntomas, Signos, Estudios de laboratorio y Diagnóstico diferencial. Cada una declara qué captura y dónde se guarda. `buildSectionGroups` calcula los estados y `sectionsWithData` permite retomar a un paciente.
- **`HomeScreen`:** carga el expediente al elegir paciente, marca las secciones guardadas y pasa a la siguiente. El panel del expediente muestra la enfermedad preexistente, los hallazgos y el diagnóstico.
- **Ajustes:**
  - La portada con paciente quedó compacta y dice "Elige de la base de conocimiento…".
  - El recorrido de bienvenida describe las secciones nuevas.
  - En el panel, el grupo de findings `Estudio_diagdif` se llama ahora "Estudios de diagnóstico diferencial", para no confundirlo con la sección de resultado.

**Hallazgo honesto:** el motor provisional acierta 10 de 10 pacientes de prueba, pero esa cifra no mide la calidad diagnóstica, porque los hallazgos de prueba ya traen el ID de su enfermedad (ESP-005, sección 5).

**Archivos afectados:**

- Backend: `PatientFinding.cs`, `SaveFindingsRequest.cs`, `PatientRecord.cs`, `DiagnosisResult.cs`, `IPatientRecordRepository.cs`, `PatientRecordRepository.cs`, `IPatientRecordService.cs`, `PatientRecordService.cs`, `IInferenceEngine.cs`, `ProvisionalInferenceEngine.cs`, `IDiagnosisService.cs`, `DiagnosisService.cs`, `PatientRecordController.cs`, `AppDbContext.cs`, `Program.cs`, `PatientRecordServiceTests.cs` y `ClinicalDataIntegrationTests.cs`.
- Frontend: `lib/backendSession.ts`, `lib/recordRules.ts`, `types/record.ts`, `services/recordService.ts`, `app/api/patients/[id]/record`, `findings/[section]`, `preexisting-disease` y `analysis`, `components/home/clinicalSections.ts`, `HomeScreen.tsx`, `PatientRecordPanel.tsx`, `components/assistant/SectionCapture.tsx`, `DiagnosisPanel.tsx`, `AssistantChat.tsx`, `ChatIntro.tsx` y `lib/welcomeTour.ts`.
- Specs: `especificaciones/08-captura-y-analisis.md` (nueva), `06-bienvenida-asistente.md`, `planes/01-arquitectura-y-patrones.md` y `tareas/inicio-sesion.md`.

**Verificación automática:**

- `dotnet build` sin advertencias.
- 53 pruebas unitarias correctas (PT49 a PT55 incluidas).
- Integración de solo lectura contra la base real: PT47, PT48, PT56 y PT57.
- `tsc` y `eslint` sin errores.
- Pruebas con `tsx` de `recordRules` y de `buildSectionGroups`.
- HTTP sin sesión:
  - los endpoints nuevos responden 401;
  - una sección o un ID inexistente responde 404 en Next;
  - un `idRegistro` con intento de inyección responde 400 en Next, sin llegar a la API.
- Edge sin interfaz: barra lateral con las 6 secciones y "Paso 1 de 6". Sin errores en la consola.

**Revisión humana:** pendiente. El flujo con sesión iniciada (PT58) no se pudo probar sin credenciales.

### P-104. La píldora del paciente se oculta al bajar y vuelve al subir

| Campo | Valor |
|---|---|
| Fecha | 2026-11-18 |
| Autor del prompt | Lucía |
| Objetivo | Que la píldora del paciente de la sesión no tape el contenido al recorrer el chat |
| Especificación / tarea | ESP-004 (RF-33) |

**Prompt**

> ¿Hay manera de hacer que este [la píldora "Diana Salas · PACIE00011"] se oculte al bajar y se muestre al subir el scroll?

**Resultado de la IA:**

- `AssistantChat` detecta la dirección del scroll del área de conversación (`onScroll`).
  - Al bajar más de 8 px, la píldora se esconde.
  - Al subir más de 8 px, o a menos de 24 px del inicio, vuelve.
  - Los movimientos pequeños se ignoran para que no parpadee.
- `SessionPatientPill` recibe `hidden`. Se desliza hacia arriba y se desvanece (`translate` y `opacity`, 300 ms) y, oculta, no recibe clics y queda `aria-hidden`. Con "reducir movimiento" el cambio es inmediato.

**Diagnóstico previo (misma sesión):** el catálogo no cargaba ("No se pudo cargar el catálogo") porque el servidor de Next que la IA dejó corriendo quedó dañado. Al detener la tarea se cerraron sus procesos auxiliares, pero no el principal, y desde entonces las rutas con parámetros (`[id]`, `[name]`) respondían 500 ("Failed to generate static paths… Jest worker…"). La API respondía bien con la sesión de prueba. Lucía cerró el proceso y reinició `npm run dev`; ahora el catálogo responde 200.

**Archivos afectados:** `frontend/components/assistant/AssistantChat.tsx`, `frontend/components/assistant/SessionPatientPill.tsx`.

**Verificación automática:**

- `tsc` y `eslint` sin errores.
- Edge sin interfaz, con la sesión de prueba y la paciente `PACIE00011`:
  - el catálogo carga 10 enfermedades;
  - al bajar a 200 y 400 px la píldora se oculta; al subir a 250 y 0 px reaparece.
- Sin errores en la consola.

**Revisión humana:** pendiente.

### P-105. Interfaz de salida conectada con la de entrada

| Campo | Valor |
|---|---|
| Fecha | 2026-11-18 |
| Autor del prompt | Lucía |
| Objetivo | Desarrollar la interfaz de salida a partir de su boceto y conectarla con la de entrada, de forma lógica y coherente con lo que dijo Axel |
| Especificación / tarea | ESP-006 (nueva), T56, T58 y T59 |

**Prompt**

> ¿Y cómo podemos también desarrollar la interfaz de salida y conectarla, o que esté conectada o lleve de la interfaz de entrada a la interfaz de salida? Este era el boceto [Buscar paciente, Descargar, Compartir, Imprimir; paciente con edad, sexo y expediente; tarjetas Historia clínica, Diagnóstico, Tratamiento y Plan, expectativa y seguimiento; columna "Expediente de"], pero debería ser todo muy lógico y coherente entre sí, tomando en cuenta lo que dijo Axel antes.
>
> (Decisiones ante tres preguntas de la IA) El médico elige el tratamiento; el plan lo escribe el médico; quitar "Compartir" por ahora.

**Hallazgos en los datos antes de diseñar:**

- Cada enfermedad tiene de 7 a 20 tratamientos, pero `PACIENTES` guarda uno.
- `PLANES` tiene un plan por paciente de prueba, sin relación con las enfermedades.
- El sexo del boceto no existe en la tabla (A-11).

**Resultado de la IA:**

- **Flujo:** Entrada → Analizar → "Confirmar este diagnóstico" en cada candidato → Salida.
- **Backend:**
  - `GET result`, `PUT diagnosis`, `PUT treatment` y `PUT plan`.
  - Confirmar otra enfermedad quita el tratamiento anterior.
  - El tratamiento debe ser de la enfermedad confirmada.
  - El plan se crea con el siguiente `PLAN_xxxxx` o se actualiza.
- **Frontend:** página `/patients/{id}/result` según el boceto.
  - Izquierda: Buscar paciente, Volver a la captura, Descargar PDF e Imprimir.
  - Centro: encabezado del paciente y las cuatro tarjetas.
  - Derecha: "Expediente de", con el estado de cada parte.
  - Impresión: queda limpia, solo con el centro.
- **Enlaces:**
  - "Ver resultado" en el buscador para pacientes con diagnóstico.
  - `/home?paciente=ID` retoma al paciente; `/home?buscar=1` abre el buscador.
- **Incidencia del entorno:** `dotnet run --artifacts-path` ejecutó el `.exe` viejo de `bin`, que sigue bloqueado por la API de Lucía. Para probar, la IA corrió la DLL nueva en el puerto 5199 y en el navegador redirigió solo la lectura del resultado a esa API.

**Archivos afectados:**

- Backend: `Treatment.cs` (con `CarePlan`), `PatientResult.cs`, `SaveResultRequests.cs`, `IPatientResultRepository.cs`, `PatientResultRepository.cs`, `IPatientResultService.cs`, `PatientResultService.cs`, `PatientResultController.cs`, `AppDbContext.cs`, `Program.cs`, `PatientResultServiceTests.cs` y `ClinicalDataIntegrationTests.cs`.
- Frontend: `types/result.ts`, `services/resultService.ts`, `app/api/patients/[id]/{result,diagnosis,treatment,plan}/route.ts`, `app/(app)/patients/[id]/result/page.tsx`, `components/result/PatientResultScreen.tsx`, `components/result/ResultSections.tsx`, `components/assistant/DiagnosisPanel.tsx`, `components/home/PatientSearchDialog.tsx` y `components/home/HomeScreen.tsx`.
- Specs: `especificaciones/09-interfaz-de-salida.md` (nueva), `08-captura-y-analisis.md` (RF-42), `planes/01-arquitectura-y-patrones.md` y `tareas/inicio-sesion.md`.

**Verificación automática:**

- `dotnet build` sin advertencias.
- 61 pruebas unitarias correctas (PT59 a PT64).
- PT65 contra la base real, de solo lectura.
- `tsc` y `eslint` sin errores.
- HTTP con la sesión de prueba (PT66):
  - el resultado de `PACIE00001` trae su diagnóstico, 13 tratamientos con el indicado, su plan y 23 hallazgos;
  - un tratamiento de otra enfermedad y una enfermedad inexistente responden 400.
- Edge sin interfaz (PT67): la pantalla completa y la vista de impresión de `PACIE00001`. Sin errores en la consola.

**Revisión humana:** pendiente. Lucía debe reiniciar su API para que el frontend use los endpoints nuevos (PT68 a PT71).

### P-106. Primera hoja vacía al descargar el PDF del resultado

| Campo | Valor |
|---|---|
| Fecha | 2026-11-18 |
| Autor del prompt | Lucía |
| Objetivo | Que el PDF no deje la primera hoja vacía ni empuje todo hacia abajo |
| Especificación / tarea | ESP-006 (RF-49) |

**Prompt**

> Se ve vacía la primera hoja en el PDF y todo lo demás salta hacia abajo; soluciona [captura: hoja 1 solo con el encabezado del paciente].

**Causa:** cada tarjeta tenía `break-inside-avoid` (no partirse entre hojas). "Historia clínica" es más alta que el espacio que queda en la primera hoja, así que el navegador la mandaba completa a la siguiente y dejaba la primera solo con el encabezado.

**Corrección:**

- Las tarjetas sí pueden partirse entre hojas.
- Lo que no se parte es cada grupo de datos: la enfermedad preexistente, cada tipo de hallazgo y cada campo del plan (`break-inside-avoid`).
- Los títulos de las tarjetas no quedan solos al final de una hoja (`break-after-avoid`).
- Al imprimir, el contenedor ya no exige el alto de la pantalla (`print:min-h-0`) y el espaciado es más compacto.

**Archivos afectados:** `frontend/components/result/ResultSections.tsx`, `frontend/components/result/PatientResultScreen.tsx`.

**Verificación automática:**

- `tsc` y `eslint` sin errores.
- PDF real generado desde Edge sin interfaz (`Page.printToPDF`) para `PACIE00001`; se extrajo el texto de cada hoja con `pypdf`:
  - hoja 1: encabezado e historia clínica completa;
  - hoja 2: diagnóstico, tratamiento, plan y aviso.

**Revisión humana:** error detectado por Lucía.

### P-107. La interfaz de salida no respondía a los clics al entrar desde el buscador

| Campo | Valor |
|---|---|
| Fecha | 2026-11-18 |
| Autor del prompt | Lucía |
| Objetivo | Que la interfaz de salida responda a los clics |
| Especificación / tarea | ESP-006 (RF-50) |

**Prompt**

> Hay un problema: cuando estoy en la interfaz de salida, no me deja dar clic a nada.

**Causa (reproducida en Edge sin interfaz con clics de mouse reales):**

- Al entrar con "Ver resultado" dentro del buscador, este (`<dialog>` modal) seguía abierto.
- Con `cacheComponents`, Next no desmonta `/home` al navegar: la oculta. El diálogo quedaba modal en el *top layer* y volvía inerte toda la página de salida (`dialog:modal` = true; `elementFromPoint` devolvía `<html>`).
- Al abrir la página directamente no pasaba; por eso no apareció en la verificación de P-105.

**Corrección:**

- "Ver resultado" cierra el buscador al pulsarse.
- `PatientSearchDialog` y `NewPatientDialog` cierran su `<dialog>` en la limpieza del efecto, es decir, al desmontarse u ocultarse. Ningún diálogo puede quedar abierto detrás de otra pantalla.

**Archivos afectados:** `frontend/components/home/PatientSearchDialog.tsx`, `frontend/components/home/NewPatientDialog.tsx`.

**Verificación automática:**

- `tsc` y `eslint` sin errores.
- Mismo camino (buscador → "Ver resultado" → `PACIE00003`) con clics reales:
  - antes: 1 diálogo modal abierto y ningún clic respondía;
  - ahora: 0 diálogos abiertos, el radio de tratamiento se marca, se escribe en el plan y "Volver a la captura" navega.
- Sin errores en la consola.

**Revisión humana:** error detectado por Lucía (ver A-20).

### P-108. "Confirmando…" quedaba atascado al volver a la entrada; "Volver a la captura" no abría al paciente

| Campo | Valor |
|---|---|
| Fecha | 2026-11-18 |
| Autor del prompt | Lucía |
| Objetivo | Que al volver de la interfaz de salida el botón "Confirmar diagnóstico" esté disponible |
| Especificación / tarea | ESP-006 (RF-44, RF-50) |

**Prompt**

> Tengo un nuevo problema: cuando le doy a "Confirmar diagnóstico" y abre la interfaz de salida, pero me devuelvo a la interfaz de entrada, el botón de "Confirmar diagnóstico" se queda esperando aún y sale el cursor de carga girando encima del botón.

**Causas:**

1. **Botón atascado.** Con `cacheComponents`, Next conserva `/home` oculta al navegar. `DiagnosisPanel` dejaba `confirming` con el ID mientras navegaba y, al volver, el estado seguía igual: botón deshabilitado, "Confirmando…" y cursor de espera.
2. **Encontrado al reproducirlo (error de P-105):** `/home?paciente=ID` no abría al paciente, y `?buscar=1` no abría el buscador. El efecto de inicio corre dos veces (Strict Mode en desarrollo, o al volver a mostrarse la pantalla). En la primera lectura se limpiaba la URL y en la segunda se sobrescribía lo leído con `null`.

**Corrección:**

- `DiagnosisPanel` limpia `confirming` cuando su pantalla se oculta (limpieza del efecto).
- `HomeScreen` solo anota el paciente o el buscador pedidos si vienen en la URL (refs que no se sobrescriben), y abre el buscador en cuanto se confirma la sesión.

**Archivos afectados:** `frontend/components/assistant/DiagnosisPanel.tsx`, `frontend/components/home/HomeScreen.tsx`.

**Verificación automática:**

- `tsc` y `eslint` sin errores.
- Edge sin interfaz, con la sesión de prueba y `PACIE00007`, confirmando el mismo diagnóstico que ya tenía para no alterar los datos:
  1. `/home?paciente=PACIE00007` abre al paciente con sus secciones completadas.
  2. Analizar → Confirmar → `/patients/PACIE00007/result`.
  3. Al regresar, el botón dice "Confirmar este diagnóstico" y está habilitado.
- Sin errores en la consola.

**Revisión humana:** error detectado por Lucía; la IA encontró y corrigió el segundo al reproducirlo.

### P-109. La interfaz de salida con el mismo estilo que la de entrada, y "Nuevo paciente"

| Campo | Valor |
|---|---|
| Fecha | 2026-11-18 |
| Autor del prompt | Lucía |
| Objetivo | Que la interfaz de salida se diferencie lo mínimo de la de entrada, y que tenga "Nuevo paciente" |
| Especificación / tarea | ESP-006 |

**Prompts**

> En la interfaz de salida, coloca el panel blanco, no gris, igual que en la de entrada, y que la diferencia sea la mínima. RESPETA LA UI.
>
> Te faltó añadir lo de "Nuevo paciente" igual en la interfaz de salida.

**Resultado de la IA:**

- **Fondo:** blanco (`bg-white`, también mientras carga), igual que la entrada. Antes era `slate-100`.
- **Barra lateral:** `w-72` con borde `border-white/10`, igual que la de la entrada. Antes medía `w-64` y no tenía borde.
- **Columna derecha "Expediente de":** `w-80`, igual que el panel del expediente de la entrada. Antes medía `w-72`.
- **"Nuevo paciente":** va debajo de "Buscar paciente", con el mismo estilo de acción secundaria que en la entrada (borde `white/25`, sin relleno). Lleva a `/home?nuevo=1`, que abre la ventana de alta. `HomeScreen` atiende `?nuevo=1` igual que `?buscar=1`.

**Archivos afectados:** `frontend/components/result/PatientResultScreen.tsx`, `frontend/app/(app)/patients/[id]/result/page.tsx`, `frontend/components/home/HomeScreen.tsx`.

**Verificación automática:**

- `tsc` y `eslint` sin errores.
- Captura de la salida de `PACIE00003` en Edge sin interfaz.
- Un clic real en "Nuevo paciente" lleva a `/home` con la ventana "Nuevo paciente" abierta.
- Sin errores en la consola.

**Revisión humana:** correcciones de diseño pedidas por Lucía.

### P-110. Acceso a la interfaz de salida desde el panel del expediente

| Campo | Valor |
|---|---|
| Fecha | 2026-11-18 |
| Autor del prompt | Lucía |
| Objetivo | Poder abrir la interfaz de salida desde el panel "Expediente" de la interfaz de entrada |
| Especificación / tarea | ESP-006 (RF-50) |

**Prompt**

> ¿Crees que aquí también se pueda acceder a la interfaz de salida? [captura del panel "Expediente", sección "Diagnóstico diferencial"].

**Resultado de la IA:** con un paciente seleccionado, bajo "Diagnóstico diferencial" aparece el botón "Ver resultado del expediente".

- Estilo de acción secundaria verde cyan, como "Confirmar este diagnóstico".
- Lleva a `/patients/{id}/result`.
- Se muestra también sin diagnóstico confirmado: la salida indica lo que falta.
- Aparece en la columna fija y en el cajón de pantallas medianas.

**Archivos afectados:** `frontend/components/home/PatientRecordPanel.tsx`.

**Verificación automática:**

- `tsc` y `eslint` sin errores.
- Edge sin interfaz con `PACIE00007`: el enlace aparece en el panel y un clic real abre su interfaz de salida.
- Sin errores en la consola.

**Revisión humana:** propuesta de Lucía.

### P-111. El acceso a la salida solo aparece con un diagnóstico confirmado

| Campo | Valor |
|---|---|
| Fecha | 2026-11-18 |
| Autor del prompt | Lucía |
| Objetivo | Quitar la ambigüedad de "Ver resultado del expediente" antes de confirmar un diagnóstico |
| Especificación / tarea | ESP-006 (RF-50) |

**Prompt**

> Es que yo lo siento un poco ambiguo. Por ejemplo, dice "Ver resultado del expediente", pero se puede llegar ahí o verlo sin haber llegado a ver los diagnósticos diferenciales y haber confirmado dicho diagnóstico. No entiendo.

**Resultado de la IA:** se respeta el flujo Analizar → Confirmar → Resultado.

- **En el panel del expediente:**
  - Sin diagnóstico confirmado no hay botón, solo una guía: "Al analizar y confirmar un diagnóstico podrás ver el resultado del expediente", o "Confirma uno de los candidatos…" si ya hay análisis.
  - Con diagnóstico confirmado se muestra "Diagnóstico confirmado: {enfermedad}" y el botón "Ver resultado del expediente".
- **Al confirmar:** `DiagnosisPanel` avisa con `onConfirmed`. `HomeScreen` anota el diagnóstico en el paciente seleccionado y en la lista del buscador, así que al volver el panel ya ofrece el resultado sin recargar.

**Archivos afectados:** `frontend/components/home/PatientRecordPanel.tsx`, `frontend/components/assistant/DiagnosisPanel.tsx`, `frontend/components/assistant/AssistantChat.tsx`, `frontend/components/home/HomeScreen.tsx`.

**Verificación automática:**

- `tsc` y `eslint` sin errores.
- Edge sin interfaz:
  - con diagnóstico (`PACIE00007` y `PACIE00011`, con asma confirmada por Lucía en sus pruebas) aparecen el diagnóstico confirmado y el botón;
  - sin diagnóstico (simulado en el navegador, sin tocar la base) no hay botón y aparece la guía.
- Sin errores en la consola.

**Revisión humana:** ambigüedad señalada por Lucía (ver A-21).

### P-112. Análisis desactualizado cuando cambian los hallazgos

| Campo | Valor |
|---|---|
| Fecha | 2026-11-18 |
| Autor del prompt | Lucía |
| Objetivo | Marcar el análisis como desactualizado si se guardan hallazgos después de analizar (propuesta de la IA en la conversación sobre "Volver a analizar") |
| Especificación / tarea | ESP-005 (RF-51) |

**Prompt**

> Marca el análisis como desactualizado si cambian los hallazgos.

**Resultado de la IA:**

- `HomeScreen` lleva `isDiagnosisStale`:
  - se activa al guardar una sección si ya había un análisis;
  - se apaga al volver a analizar o al cambiar de paciente.
- **Panel del análisis (`DiagnosisPanel`):** aviso ámbar "Los hallazgos cambiaron después de este análisis. Vuelve a analizar para actualizarlo antes de confirmar un diagnóstico". "Confirmar este diagnóstico" queda deshabilitado, para no confirmar con datos que ya cambiaron.
- **Panel del expediente:** la etiqueta "desactualizado" reemplaza a "provisional", la lista se atenúa y aparece la indicación "Los hallazgos cambiaron: vuelve a analizar en «Diagnóstico diferencial»".

**Archivos afectados:** `frontend/components/home/HomeScreen.tsx`, `frontend/components/assistant/AssistantChat.tsx`, `frontend/components/assistant/DiagnosisPanel.tsx`, `frontend/components/home/PatientRecordPanel.tsx`, `specs/especificaciones/08-captura-y-analisis.md`.

**Verificación automática:**

- `tsc` y `eslint` sin errores.
- Edge sin interfaz con `PACIE00007`. El guardado se interceptó en el navegador y se respondió con el expediente actual, así que no se tocó la base.
  1. Analizar.
  2. Guardar "Síntomas": aparece el aviso, "Confirmar" queda deshabilitado y el panel dice "desactualizado".
  3. Volver a analizar: desaparece el aviso, "Confirmar" se habilita y el panel vuelve a "provisional".
- Sin errores en la consola.

**Revisión humana:** pedido por Lucía.

### P-113. Candidatos del diagnóstico diferencial más visibles en el panel

| Campo | Valor |
|---|---|
| Fecha | 2026-11-18 |
| Autor del prompt | Lucía |
| Objetivo | Hacer más visibles y con color las opciones del diagnóstico diferencial en el panel derecho |
| Especificación / tarea | ESP-005 (RF-41) |

**Prompt**

> Deberías mejorar o hacer mejor con colores el diagnóstico diferencial, las opciones, más visibles, en el menú derecho [captura: "1. Lupus eritematoso sist… 11%", con el nombre cortado y en texto plano].

**Resultado de la IA:** cada candidato es una tarjeta con:

- el número en un círculo: el primero en verde cyan (`teal-600`) y su tarjeta resaltada (`border-teal-500`, `bg-teal-50`); los demás en azul marino;
- el nombre completo en negrita, sin cortar (antes `truncate`);
- la etiqueta "Confirmado" si es el diagnóstico confirmado;
- una barra de coincidencia (`role="meter"`) en el azul de las burbujas (`#1e47c5`), en verde cyan para el primero, con el porcentaje en negrita;
- "x de y criterios" debajo.

**Archivos afectados:** `frontend/components/home/PatientRecordPanel.tsx`.

**Verificación automática:**

- `tsc` y `eslint` sin errores.
- Captura ampliada del panel en Edge sin interfaz, tras analizar `PACIE00007` (solo lectura).
- Sin errores en la consola.

**Revisión humana:** corrección visual pedida por Lucía; ajustó la primera reducción por quedar demasiado pequeña.

### P-114. Panel derecho en azul y botón de análisis con estado claro

| Campo | Valor |
|---|---|
| Fecha | 2026-11-18 |
| Autor del prompt | Lucía |
| Objetivo | Usar azul en el diagnóstico diferencial del panel derecho y que se entienda qué hace "Volver a analizar" |
| Especificación / tarea | ESP-005 (RF-41, RF-42, RF-51) |

**Prompt**

> Estaría mejor con color azul en vez de verde eso del diagnóstico diferencial en el menú derecho. Por cierto, ¿qué hace el botón "Guardar" en el menú izquierdo, o qué buena utilidad le podríamos dar? Al igual que el botón de "Volver a analizar", no se entiende muy bien qué hace: solo se queda ahí al clickear y parece que no hace ninguna acción.

**Resultado de la IA:**

- **Panel derecho en azul:**
  - el primer candidato con borde `#1e47c5` y fondo `blue-50`;
  - el círculo del primero y su barra en `#1e47c5`, y las barras de los demás en `blue-300`;
  - "Confirmado" en azul marino;
  - "Ver resultado del expediente" con borde y texto azules.
- **Botón de análisis:**
  - **Causa:** el motor da el mismo resultado con los mismos hallazgos, así que "Volver a analizar" sin cambios no cambiaba nada en pantalla.
  - **Sin análisis:** "Analizar expediente".
  - **Al día:** "Análisis al día", deshabilitado, con el estado "Análisis actualizado a las {hora} con los hallazgos guardados".
  - **Tras cambiar hallazgos:** "Volver a analizar", habilitado, junto al aviso de P-112.
- **"Guardar" del menú izquierdo:** no tenía acción (quedó del diseño inicial) y cada sección ya se guarda sola. La IA propuso convertirlo en "Siguiente paso", en "Ver resultado" o quitarlo; Lucía eligió **quitarlo**. Se eliminó de `Sidebar.tsx` junto con su ícono.

**Archivos afectados:** `frontend/components/home/PatientRecordPanel.tsx`, `frontend/components/assistant/DiagnosisPanel.tsx`, `frontend/components/home/Sidebar.tsx`.

**Verificación automática:**

- `tsc` y `eslint` sin errores.
- Edge sin interfaz con `PACIE00007`, con el guardado interceptado sin tocar la base:
  - tras analizar: "Análisis al día" deshabilitado, con hora;
  - tras guardar "Síntomas": "Volver a analizar" habilitado;
  - tras volver a analizar: otra vez al día.
- Sin errores en la consola.

**Revisión humana:** pedido por Lucía.

### P-115. Revisión de ambigüedades en la interfaz

| Campo | Valor |
|---|---|
| Fecha | 2026-11-18 |
| Autor del prompt | Lucía |
| Objetivo | Eliminar o reducir las ambigüedades que la IA encuentre en la interfaz |
| Especificación / tarea | Pantalla principal, ESP-004 a ESP-006 |

**Prompt**

> Listo, muy bien. Elimina más ambigüedades que encuentres por ahí o redúcelas.

**Método:** la IA buscó en `components/` todos los `<button>` sin `onClick` ni `type="submit"` y revisó los textos que se contradecían.

**Ambigüedades encontradas y resueltas:**

| Dónde | Problema | Resolución |
|---|---|---|
| Menú de cuenta, "Cerrar sesión" | Solo navegaba a `/login`: la cookie del token seguía y la sesión seguía activa | Ruta `DELETE /api/session` que borra la cookie httpOnly; `logout()` en `doctorService`. Tras cerrar, `/api/session` responde 401. El JWT expira solo en el backend (no hay revocación). |
| Barra superior, 🔔 Notificaciones | Sin acción ni notificaciones | Se quitó. |
| Barra superior, ? Ayuda | Sin acción | `HelpMenu`: panel con los 4 pasos del flujo y la nota de motor provisional; se cierra con Escape o clic fuera. |
| Menú de cuenta, "Mi perfil" y "Configuración" | Solo cerraban el menú; no hay pantallas | Se quitaron. |
| Cuadro de texto, 🎤 Dictar por voz | Sin acción | Se quitó. |
| Aviso, "Más información" | Sin acción | Despliega una explicación breve (`aria-expanded`): qué hace el sistema, que es apoyo y que el motor es provisional. |
| Cuadro de texto con paciente | Lo escrito no se guardaba ni tenía respuesta (no hay IA conectada) | Deshabilitado con paciente; el texto de ayuda dice "La conversación con la IA llegará con el motor de inferencia; captura en la tarjeta de arriba". |
| Encabezado "Pendiente" frente a barra lateral "En proceso" | Dos nombres para el mismo estado; "pendiente" sonaba a "bloqueada" | El encabezado dice "En proceso" (se conserva la animación de P-98). |

**Archivos afectados:** `frontend/app/api/session/route.ts`, `frontend/services/doctorService.ts`, `frontend/components/home/ProfileMenu.tsx`, `frontend/components/home/TopNavbar.tsx`, `frontend/components/home/HelpMenu.tsx` (nuevo), `frontend/components/assistant/ChatComposer.tsx`, `frontend/components/assistant/ChatNotice.tsx`, `frontend/components/assistant/AssistantChat.tsx`, `frontend/components/assistant/SectionHeader.tsx`.

**Verificación automática:**

- `tsc` y `eslint` sin errores.
- Nuevo escaneo: ningún `<button>` sin acción.
- Edge sin interfaz con la sesión de prueba y `PACIE00003`:
  - Ayuda abre con 4 pasos;
  - el encabezado dice "En proceso";
  - el cuadro está deshabilitado con el texto nuevo y sin micrófono;
  - "Más información" se despliega;
  - el menú de cuenta solo tiene "Cerrar sesión", que lleva a `/login` y deja `/api/session` en 401.
- Sin errores en la consola.

**Revisión humana:** pendiente.

---

## Prompts de Axel: extracción de la base de datos clínica

Registrados el 2026-11-20 a petición de Lucía. Axel los usó antes de crear la base de datos clínica (las tablas de `CreateClinicalTables.sql` y los datos de `SeedClinicalData.sql`, cargados el 2026-11-16), así que van fuera del orden cronológico. No quedó registrada la fecha exacta de cada prompt ni el modelo que se usó. Se numeran a partir de P-117 porque P-116 ya se cita en `especificaciones/10-panel-administrador.md`.

### P-117. Extracción completa de enfermedades del libro a tablas normalizadas

| Campo | Valor |
|---|---|
| Fecha | Antes del 2026-11-16 (fecha exacta no registrada) |
| Autor del prompt | Axel |
| Herramienta / modelo | Asistente de IA conversacional (modelo no registrado) |
| Objetivo | Extraer todas las enfermedades y defectos del libro de referencia y llenar las plantillas de Excel como una base de datos normalizada |
| Especificación / tarea | Base de datos clínica (16 tablas) |

**Prompt**

> Actúa como un arquitecto de bases de datos relacionales y especialista en extracción y normalización de datos.
>
> Te adjunto un libro y un archivo de Excel con varias tablas/plantillas. Tu objetivo es extraer TODAS las enfermedades y defectos mencionados en el libro, cruzar esa información con los datos del Excel, y rellenar las tablas exactamente bajo el esquema de una Base de Datos (BD) normalizada.
>
> Sigue estas reglas de forma estricta:
>
> 1. FUENTE DE INFORMACIÓN Y PRECISIÓN:
> - Basate exclusivamente en el libro adjunto y el archivo Excel provisto.
> - No inventes ni asumas datos. Si un campo no tiene información disponible en los archivos, déjalo vacío y repórtalo al final.
>
> 2. REGLAS ESTRICTAS DE ESTRUCTURA, IDs Y NORMALIZACIÓN DE BD:
> - **Nombres de columnas:** Respeta exactamente los nombres de las columnas definidos en las hojas del archivo Excel enviado.
> - **ID de Enfermedades y Defectos (Tabla principal - 10 caracteres `[5 LETRAS][5 NÚMEROS]`):**
>   - Las 5 letras deben corresponder a las iniciales o abreviatura en mayúsculas de la zona anatómica o sistema afectado, seguidas de un contador secuencial independiente de 5 dígitos iniciando en `00001` (ej. `HEMAT00001`, `HEMAT00002`, `CARDI00001`, `NEUMO00001`).
> - **IDs Compuestos de Tablas Asociadas (20 caracteres obligatorios: `[ID_ENFERMEDAD] + [5 LETRAS TABLA] + [5 DÍGITOS CONSECUTIVOS]`):**
>   - Para cada registro de las tablas asociadas (signos, síntomas, complicaciones, etc.), el ID debe formarse **de ley** concatenando el ID completo de la enfermedad + 5 letras en mayúsculas que identifiquen la tabla + un contador secuencial de 5 dígitos iniciando en `00001` por cada enfermedad:
>     - En Signos: `HEMAT00001SIGNO00001`, `HEMAT00001SIGNO00002`, etc.
>     - En Síntomas: `HEMAT00001SINTO00001`, `HEMAT00001SINTO00002`, etc.
>     - En Complicaciones: `HEMAT00001COMPL00001`, `HEMAT00001COMPL00002`, etc.
>     - *(Aplica esta misma regla exacta de 5 letras + 5 dígitos consecutivos para el resto de tablas del Excel).*
> - **Normalización y separación de cadenas (Atomización - 1FN):** Está prohibido llenar una sola celda con listas de texto largas o separadas por comas. Separa cada valor individual en registros atómicos (filas independientes), asignando a cada fila su ID compuesto único según el orden consecutivo (ej. fila 1 `HEMAT00001SINTO00001`: `taquicardia`; fila 2 `HEMAT00001SINTO00002`: `hematoma`).
>
> 3. ENTREGABLES:
> - **Archivo Excel completo (.xlsx):** Genera el archivo Excel descargable con todas las enfermedades y defectos extraídos, manteniendo las tablas normalizadas, las relaciones intactas y sin celdas combinadas ni saltos de línea.
> - **Documento PDF de Consulta:** Genera un archivo PDF descargable organizado como una guía visual de consulta rápida donde se muestren todas las enfermedades/defectos, sus IDs asignados y sus detalles de forma clara y legible para lectura humana.
> - **Reporte Final:** Al final de tu respuesta, incluye:
>   1. El diccionario de prefijos/sufijos de 5 letras que generaste (tanto de zonas anatómicas como de tablas).
>   2. El listado detallado de qué información o campos quedaron vacíos por cada enfermedad/defecto debido a que no aparecen en el libro ni en el Excel.

**Resultado de la IA:** Axel entregó dos reportes de esta extracción. El libro de referencia es *Harrison. Manual de medicina*, 18.ª ed., y la plantilla es `Tablas.xlsx`.

- **`Reporte_informacion_faltante.md`.** Es una extracción con 814 entidades e IDs `E0001` a `E0814`, que **no siguen** la regla de 10 caracteres del prompt. Muchas entradas son títulos de sección o restos de texto, no enfermedades (por ejemplo "Resultados", "Il-6, tnf).", "4îoespnf 4îoespnf", "T3n0m0 t3n0m0"). Dejó vacías las tablas Paciente, Plan, Hospital, Institución, Doctores, Enfermedad_preexist y Comorbilidades. También señaló que la plantilla de `Estudios_diagdif` no tiene columna para el nombre del estudio, y listó las páginas con figuras ilegibles que omitió.
- **`Reporte_Final_Libro_Completo.md`.** Es la extracción acumulada de las secciones 1 a 18 del libro, procesada por partes, y **sí sigue** el esquema de IDs. Incluye:
  - 25 prefijos de zona o sistema (`HIDRO`, `CARDI`, `INFEC`, `NEURO`, etc.), 9 sufijos de tabla (`SINTO`, `SIGNO`, `COMPL`, `ENDEM`, `LABOR`, `DIAGD`, `COMOR`, `TRATA`, `DEFEC`) y prefijos reservados para las tablas administrativas (`PACIE`, `DOCTO`, `HOSPI`, `INSTI`, `PLAN_`, `REGIO`);
  - la lista de campos vacíos por enfermedad;
  - una columna Unidades agregada a Síntomas, Signos, Estudios_labs, Estudios_diagdif y Tratamiento;
  - capítulos omitidos por no describir enfermedades;
  - 9 enfermedades repetidas entre secciones, que se conservaron;
  - Enfermedad_endemica y Region_Estado casi vacías (3 registros y 2 regiones).

**Archivos afectados:** ninguno del repositorio directamente. El Excel resultante es la fuente de los CSV con los que se generaron `backend/XpertDiagnostic.Api/Sql/CreateClinicalTables.sql` y `SeedClinicalData.sql`, que usan el esquema de IDs del segundo reporte (`CARDI00017`, `NEUMO00008`, etc.).

**Verificación automática:** no aplica (extracción hecha fuera del repositorio).

**Revisión humana:** revisada por Axel, que comparó los dos reportes y adoptó el esquema de IDs con prefijos. Entre las limitaciones conocidas están los campos vacíos, las entradas duplicadas y Enfermedad_endemica casi vacía.

### P-118. Prueba de validación con una sola enfermedad

| Campo | Valor |
|---|---|
| Fecha | Antes del 2026-11-16 (fecha exacta no registrada) |
| Autor del prompt | Axel |
| Herramienta / modelo | Asistente de IA conversacional (modelo no registrado) |
| Objetivo | Revisar el esquema de IDs, los IDs compuestos de 20 caracteres y la atomización con un solo caso antes de procesar todo el libro |
| Especificación / tarea | Base de datos clínica (16 tablas) |

**Prompt**

> Actúa como un arquitecto de bases de datos relacionales y especialista en extracción y normalización de datos.
>
> Te adjunto un libro y un archivo de Excel con varias tablas/plantillas. Antes de procesar todo el documento, quiero hacer una PRUEBA DE VALIDACIÓN extrayendo ÚNICAMENTE UNA (1) enfermedad o defecto del libro, cruzándolo con los datos del Excel y rellenando las tablas bajo el esquema de una Base de Datos (BD) normalizada.
>
> Sigue estas reglas de forma estricta:
>
> 1. FUENTE DE INFORMACIÓN Y PRECISIÓN:
> - Elige 1 enfermedad o defecto completo que aparezca en el libro adjunto y crúzalo con la información del Excel.
> - Basate exclusivamente en los archivos provistos. No inventes ni asumas datos. Si algún campo no tiene información disponible, déjalo vacío y repórtalo al final.
>
> 2. REGLAS ESTRICTAS DE ESTRUCTURA, IDs Y NORMALIZACIÓN DE BD:
> - **Nombres de columnas:** Respeta exactamente los nombres de las columnas definidos en las hojas del archivo Excel enviado.
> - **ID de Enfermedades y Defectos (Tabla principal - 10 caracteres `[5 LETRAS][5 NÚMEROS]`):**
>   - Las 5 letras deben corresponder a las iniciales o abreviatura en mayúsculas de la zona anatómica o sistema afectado, seguidas de un contador de 5 dígitos iniciando en `00001` (ej. `HEMAT00001` para sistema hematológico, `CARDI00001` para corazón, `NEUMO00001` para pulmón).
> - **IDs Compuestos de Tablas Asociadas (20 caracteres obligatorios: `[ID_ENFERMEDAD] + [5 LETRAS TABLA] + [5 DÍGITOS CONSECUTIVOS]`):**
>   - Para cada registro de las tablas asociadas (signos, síntomas, complicaciones, etc.), el ID debe construirse **de ley** con el ID completo de la enfermedad + 5 letras en mayúsculas de la tabla + un contador consecutivo de 5 dígitos iniciando en `00001` por cada enfermedad:
>     - En Signos: `HEMAT00001SIGNO00001`, `HEMAT00001SIGNO00002`, etc.
>     - En Síntomas: `HEMAT00001SINTO00001`, `HEMAT00001SINTO00002`, etc.
>     - En Complicaciones: `HEMAT00001COMPL00001`, `HEMAT00001COMPL00002`, etc.
>     - *(Aplica esta misma regla exacta de 5 letras + 5 dígitos consecutivos para cualquier otra tabla del Excel).*
> - **Normalización y separación de cadenas (Atomización - 1FN):** Está prohibido llenar una sola celda con listas de texto largas o separadas por comas. Separa cada valor individual en registros atómicos (filas independientes), asignando a cada fila su ID compuesto único según el orden consecutivo (ej. fila 1 `HEMAT00001SINTO00001`: `taquicardia`; fila 2 `HEMAT00001SINTO00002`: `hematoma`).
>
> 3. ENTREGABLES DE LA PRUEBA:
> - **Vista previa en texto:** Muéstrame en tu respuesta todas las tablas resultantes de este único caso (en formato Markdown) para que yo pueda revisar cómo quedaron los IDs principales, los IDs compuestos de 20 caracteres y la separación de cadenas.
> - **Archivo Excel de prueba (.xlsx):** Genera el archivo Excel descargable con este único registro rellenado en tus plantillas.
> - **Reporte:** Indícame qué prefijos/sufijos de 5 letras usaste y qué campos quedaron vacíos por falta de información en el libro.

**Resultado de la IA:** no se conservó la salida de esta prueba. Su propósito era validar en un solo caso las reglas de P-117: el ID de 10 caracteres, el ID compuesto de 20 caracteres y una fila por valor (1FN). Esas reglas son las que aparecen en el reporte final y en `SeedClinicalData.sql`.

**Archivos afectados:** ninguno del repositorio.

**Verificación automática:** no aplica (prueba hecha fuera del repositorio).

**Revisión humana:** revisada por Axel; la prueba servía justamente para revisar el formato antes de la extracción completa.

### P-119. Título de bienvenida más pequeño

| Campo | Valor |
|---|---|
| Fecha | 2026-11-22 |
| Autor del prompt | Lucía |
| Objetivo | Reducir el tamaño del título "Te damos la bienvenida a XpertDiagnostic" |
| Especificación / tarea | Pantalla principal |

**Prompt**

> Puedes reducir un poco más el texto "Te damos la bienvenida a XpertDiagnostic".

> Es decir, que se vea gigante, pero no tanto.
>
> Un poquititito más gigante.
>
> Pon un poco más pequeño el texto, Te damos la bienvenida a XpertDiagnostic.

**Resultado de la IA:**

- Primero bajó el título un escalón en cada tamaño de pantalla: de `text-4xl`, `sm:text-5xl` y `lg:text-6xl` (36, 48 y 60 px) a `text-3xl`, `sm:text-4xl` y `lg:text-5xl` (30, 36 y 48 px).
- Lucía aclaró que debía seguir viéndose grande. Pasó a un punto intermedio: `text-4xl`, `sm:text-[2.75rem]` y `lg:text-[3.5rem]` (36, 44 y 56 px).
- Lucía pidió "un poquititito más gigante". Quedó en `text-[2.375rem]`, `sm:text-[2.875rem]` y `lg:text-[3.625rem]` (38, 46 y 58 px), apenas por debajo del original.
- Lucía pidió el texto un poco más pequeño. Pasó a `text-4xl`, `sm:text-[2.625rem]` y `lg:text-[3.25rem]` (36, 42 y 52 px).
- Ya con Geist (P-123), Lucía lo pidió otra vez un poco más pequeño. Quedó en `text-[2rem]`, `sm:text-[2.375rem]` y `lg:text-[2.875rem]` (32, 38 y 46 px).
- El subtítulo y la portada con paciente no cambian.

**Archivos afectados:** `frontend/components/assistant/ChatIntro.tsx`.

**Verificación automática:** `eslint` sin errores.

**Revisión humana:** corrección visual pedida por Lucía; ajustó la primera reducción por quedar demasiado pequeña.

### P-120. Ilustración en "Sin paciente seleccionado"

| Campo | Valor |
|---|---|
| Fecha | 2026-11-22 |
| Autor del prompt | Lucía |
| Objetivo | Mostrar la imagen `usernofound.png` en el recuadro "Sin paciente seleccionado" del panel derecho |
| Especificación / tarea | Pantalla principal |

**Prompt**

> Puedes colocar la imagen usernofound.png que está en la carpeta public sin fondo ni bordes ni nada, en el recuadro de "Sin paciente seleccionado" del panel derecho.

> Un poquito más pequeño.

**Resultado de la IA:**

- El ícono `UserRound` dentro del círculo blanco se reemplaza por `/usernofound.png` (`object-contain`), sin fondo, borde ni forma. Es decorativa (`alt=""`), porque el texto de abajo ya explica el estado.
- Primero midió 96 × 96 px (`h-24 w-24`). A pedido de Lucía bajó a 80 × 80 px (`h-20 w-20`).

**Archivos afectados:** `frontend/components/home/PatientRecordPanel.tsx`.

**Verificación automática:** `tsc` y `eslint` sin errores.

**Revisión humana:** pedido por Lucía.

### P-121. Cal Sans como fuente principal

| Campo | Valor |
|---|---|
| Fecha | 2026-11-22 |
| Autor del prompt | Lucía |
| Objetivo | Cambiar la fuente principal de toda la app web de Atkinson Hyperlegible a Cal Sans |
| Especificación / tarea | Interfaz general |

**Prompt**

> Puedes cambiar la de Atkinson, la fuente principal, por la Cal Sans, en toda la app web.

**Resultado de la IA:**

- `layout.tsx` carga `public/CalSans-Regular.ttf` con `next/font/local` como la variable `--font-cal-sans`, en lugar de `AtkinsonHyperlegible.ttf`.
- `globals.css` asigna `--font-cal-sans` a `--font-sans` de Tailwind y al `font-family` del `body`, así que el cambio aplica a toda la app.
- `font-mono` (IDs y cédulas del panel de administrador) no cambia.
- `AtkinsonHyperlegible.ttf` se queda en `public` por si se quiere volver a ella.
- Cal Sans solo tiene un peso (Regular). Las clases `font-medium`, `font-semibold` y `font-bold` ya no cambian a un peso real: el navegador engrosa el texto artificialmente.

**Archivos afectados:** `frontend/app/layout.tsx`, `frontend/app/globals.css`.

**Verificación automática:** `tsc` y `eslint` sin errores.

**Revisión humana:** pedido por Lucía.

### P-122. Solo tres patrones de diseño: Estado, Fachada y Singleton

| Campo | Valor |
|---|---|
| Fecha | 2026-11-22 |
| Autor del prompt | Lucía |
| Objetivo | Quitar la mención al patrón Strategy y dejar solo los tres patrones del plan 01 |
| Especificación / tarea | Plan 01 (sección 4) |

**Prompt**

> Elimina Strategy, es que solo usaremos esos 3: Estado, Fachada y Singleton.

**Resultado de la IA:**

- P-103 decía que `IInferenceEngine`, `ProvisionalInferenceEngine` y `DiagnosisService` aplicaban el patrón Strategy y remitía a una "sección 4.4 del plan 01" que no existe. Se quitó esa mención.
- El código no cambia: `IInferenceEngine` sigue siendo una interfaz con su implementación, igual que las demás capas (inversión de dependencias), pero ya no se presenta como patrón GoF.
- No quedan otras menciones a Strategy en el repositorio. Los patrones documentados son los tres de la sección 4 del plan 01: Singleton, Fachada y Estado.

**Archivos afectados:** `specs/bitacora/bitacora-prompts.md` (P-103).

**Verificación automática:** búsqueda de "Strategy" y "estrategia" en todo el repositorio, sin resultados.

**Revisión humana:** Lucía detectó la inconsistencia y decidió conservar solo tres patrones (A-22).

### P-123. Geist como fuente principal

| Campo | Valor |
|---|---|
| Fecha | 2026-11-22 |
| Autor del prompt | Lucía |
| Objetivo | Cambiar la fuente principal de toda la app web de Cal Sans (P-121) a Geist |
| Especificación / tarea | Interfaz general |

**Prompt**

> Coloca Geist.

**Resultado de la IA:**

- `layout.tsx` carga Geist con `next/font/google` (subconjunto `latin`) como la variable `--font-geist`, en lugar de `CalSans-Regular.ttf`.
- `globals.css` asigna `--font-geist` a `--font-sans` de Tailwind y al `font-family` del `body`.
- Geist es una fuente variable con todos los pesos, así que `font-medium`, `font-semibold` y `font-bold` vuelven a usar pesos reales (con Cal Sans el navegador los simulaba).
- `font-mono` no cambia. `CalSans-Regular.ttf` y `AtkinsonHyperlegible.ttf` se quedan en `public`.
- `next/font/google` descarga la fuente al compilar y la sirve desde la propia app; el navegador no la pide a Google.

**Archivos afectados:** `frontend/app/layout.tsx`, `frontend/app/globals.css`.

**Verificación automática:** `tsc` y `eslint` sin errores. El servidor de desarrollo sirve la página con la clase de Geist y el CSS con `font-family: var(--font-geist)`.

**Revisión humana:** Lucía eligió Geist entre las fuentes recomendadas.

### P-124. Íconos más grandes en el expediente minimizado

| Campo | Valor |
|---|---|
| Fecha | 2026-11-22 |
| Autor del prompt | Lucía |
| Objetivo | Agrandar un poco los íconos de hallazgos del lomo del expediente minimizado y separarlos más, sin que dejen de caber |
| Especificación / tarea | Pantalla principal (panel derecho) |

**Prompt**

> Coloca estos minimizados un poco más grandecitos pero que quepan bien y un poco más de gap entre ellos.
>
> Colócales un cursor pointer.
>
> Ponles algo hover.

**Resultado de la IA:**

- Los seis círculos de hallazgos pasan de 28 a 32 px (`h-8 w-8`) y sus íconos, de 16 a 18 px.
- La separación entre ellos pasa de 6 a 10 px (`gap-2.5`).
- Caben en el lomo de 62 px de ancho, incluido el contador de la esquina. Los 44 px de alto adicionales los absorbe la barra de avance, que es la parte flexible del lomo (P-100).
- Todo el lomo es el botón que reabre el expediente; se le agregó `cursor-pointer`, así que la mano aparece sobre los íconos y sobre el resto del lomo.
- Al pasar el cursor, cada ícono crece un poco (`hover:scale-115`, 200 ms, sin animación con "reducir movimiento") y muestra un globo nativo con la sección y su número de hallazgos (por ejemplo, "Síntomas: 0"). El lomo completo conserva su fondo `slate-50` al pasar el cursor.

**Archivos afectados:** `frontend/components/home/PatientRecordPanel.tsx`.

**Verificación automática:** `eslint` sin errores.

**Revisión humana:** corrección visual pedida por Lucía.

### P-125. Campo de edad más compacto

| Campo | Valor |
|---|---|
| Fecha | 2026-11-22 |
| Autor del prompt | Lucía |
| Objetivo | Acercar la unidad "años" al número en el campo Edad del alta de paciente |
| Especificación / tarea | ESP-004 (nuevo paciente) |

**Prompt**

> 30 años se ve muy separado.

**Resultado de la IA:** el campo Edad pasa de 160 a 112 px de ancho (`w-40` → `w-28`). "años" sigue fijo a la derecha, pero ahora queda cerca del número. Caben los tres dígitos del máximo (130) sin chocar con la unidad.

**Archivos afectados:** `frontend/components/home/NewPatientDialog.tsx`.

**Verificación automática:** `eslint` sin errores.

**Revisión humana:** corrección visual pedida por Lucía.

### P-126. Menos estilos con apariencia de "hecho por IA"

| Campo | Valor |
|---|---|
| Fecha | 2026-11-22 |
| Autor del prompt | Lucía |
| Objetivo | Quitar estilos que se ven genéricos o generados por IA y reemplazarlos siguiendo principios de UX, con Dribbble como referencia |
| Especificación / tarea | Interfaz general |

**Prompt**

> Quita algunos estilos que se vean AI-Handmade y reemplázalos. Usa principios UX, busca Dribbble.
>
> No, estaba bien lo de los colores de los iconos de la barra minimizada de expediente, eso mantenlo. Y también mantén lo de las imágenes blur y no blur, todo eso del expediente.

**Resultado de la IA:**

La IA revisó referencias de expedientes clínicos en Dribbble y guías sobre los rasgos típicos de las interfaces generadas por IA: colores por categoría sin significado, desenfoques y manchas decorativas, píldoras de colores por todas partes, animaciones que no informan nada y sombras genéricas. Principio aplicado: **el color debe indicar un estado, no decorar**.

- **Encabezado de la sección (`SectionHeader`):**
  - se quitaron las partículas naranjas animadas y desenfocadas de "En proceso" (P-98) y la etiqueta queda estática, en ámbar (`bg-amber-100 text-amber-900`, el mismo tono de los avisos "provisional" y "desactualizado") y con esquinas `rounded-md` en vez de píldora;
  - "Paso 1 de 6" deja de ser una píldora azul brillante y pasa a texto gris junto al grupo: "Antecedentes / Paso 1 de 6".
- **Expediente (`PatientRecordPanel`), revertido:** la IA había quitado los banners con desenfoque, los colores por tipo de hallazgo y "Sin registros", y había puesto el color según hubiera o no registros. Lucía pidió mantener todo eso como estaba, tanto en el panel abierto como en el lomo minimizado, así que el expediente vuelve a su versión anterior (con los ajustes de P-120 y P-124).
- **Portada del chat (`ChatIntro`):** se quitaron las cruces médicas decorativas del fondo.
- **Login:** la tarjeta pierde `shadow-xl` y usa un borde de 2 px, como el resto de la app.
- **CSS:** se borraron las animaciones `status-particle` y `login-float-*`, que ya no se usan.

**Archivos afectados:** `frontend/components/assistant/SectionHeader.tsx`, `frontend/components/assistant/ChatIntro.tsx`, `frontend/app/(auth)/login/page.tsx`, `frontend/app/globals.css`.

**Verificación automática:** `tsc` y `eslint` sin errores.

**Revisión humana:** Lucía rechazó los cambios del expediente y se revirtieron (A-23). El resto queda pendiente de su revisión visual.

### P-127. Menos texto en la captura de datos

| Campo | Valor |
|---|---|
| Fecha | 2026-11-22 |
| Autor del prompt | Lucía |
| Objetivo | Quitar mensajes innecesarios de la interfaz de entrada: el médico no tiene tiempo de leer mucho |
| Especificación / tarea | ESP-004, ESP-005 (interfaz de entrada) |

**Prompt**

> Elimina mensajes que no sean necesarios en la captura de datos o interfaz de entrada, recuerda que es para el médico y este no puede tener tiempo de leer mucho.

**Resultado de la IA:**

Criterio: se quita lo que repite algo visible, lo que explica algo que la interfaz ya muestra y las notas dirigidas al equipo de desarrollo. Se conservan los errores, los estados (cargando, guardando, desactualizado) y el aviso clínico de `ChatNotice`.

- **Portada con paciente (`ChatIntro`):** se quitó. "Empecemos con antecedentes: Enfermedades preexistentes" y su instrucción repetían el encabezado de la sección y el título de la tarjeta (el nombre de la sección salía tres veces). `ChatIntro` queda solo para la bienvenida sin paciente y se eliminó el tipo `ChatIntroMode`.
- **Tarjeta de captura (`SectionCapture`):**
  - se quitó la instrucción bajo el título ("Marca los síntomas que presenta el paciente. Si se pueden medir, anota el valor."), porque el campo "Valor" aparece solo cuando aplica;
  - "Cargando la base de conocimiento…" → "Cargando…";
  - "No se pudo cargar el catálogo. Revisa tu sesión e inténtalo de nuevo." → "No se pudo cargar el catálogo.";
  - "Hay N más: escribe para acotar la búsqueda." → "N más. Escribe para filtrar.";
  - "Aún no marcas síntomas." / "Ninguna: el paciente no tiene enfermedad preexistente." → "Sin selección.";
  - "Escribe solo un número, p. ej. 38.5" → "Solo números, p. ej. 38.5".
- **Diagnóstico diferencial (`DiagnosisPanel`):**
  - se quitó la descripción bajo el título y, antes del primer análisis, "Cuando termines de capturar, analiza el expediente.": el botón "Analizar expediente" basta;
  - se quitó la nota "Resultado de demostración… Se reemplazará por la máquina de inferencia del equipo…", que era para el equipo; la etiqueta "Motor provisional" se mantiene;
  - se quitó "Es una orientación; la decisión clínica es del médico tratante.", que repetía el aviso fijo de `ChatNotice`;
  - desactualizado: "Los hallazgos cambiaron. Vuelve a analizar antes de confirmar.";
  - sin coincidencias: "Sin coincidencias. Revisa los hallazgos guardados.";
  - estado del pie: "Analizado a las {hora}" / "Actualizado a las {hora}".
- **Chat con paciente:** el texto del campo de mensaje pasa de "La conversación con la IA llegará con el motor de inferencia; captura en la tarjeta de arriba." a "Captura los datos en la tarjeta de arriba".
- **Nuevo paciente (`NewPatientDialog`):** se quitaron "Solo necesitamos su nombre y su edad para abrir el expediente." y la ayuda "De 0 a 130 años.". La validación de RF-31 no cambia: si la edad está fuera de rango, el error aparece junto al campo.
- **Expediente (panel derecho):** sin cambios, por la decisión de A-23.

**Archivos afectados:** `frontend/components/assistant/AssistantChat.tsx`, `ChatIntro.tsx`, `SectionCapture.tsx`, `DiagnosisPanel.tsx`, `frontend/components/home/NewPatientDialog.tsx`, `frontend/types/assistant.ts`.

**Verificación automática:** `tsc` y `eslint` sin errores. Ninguna prueba depende de los textos quitados.

**Revisión humana:** pendiente de revisión visual de Lucía.

### P-128. "Confirmar este diagnóstico" con fondo verde azulado

| Campo | Valor |
|---|---|
| Fecha | 2026-11-22 |
| Autor del prompt | Lucía |
| Objetivo | Dar al botón "Confirmar este diagnóstico" fondo verde azulado y texto blanco |
| Especificación / tarea | ESP-005 (diagnóstico diferencial) |

**Prompt**

> Coloca "Confirmar este diagnóstico" con el fondo así no blanco sino ese verde azulado y el texto blanco.

**Resultado de la IA:** el botón deja de tener solo borde (`border-teal-600`, texto `teal-800`) y pasa a fondo `teal-700` con texto blanco, el mismo tono de "Analizar expediente" y "Guardar y continuar". Al pasar el cursor se oscurece a `teal-800`. Conserva el borde de 2 px (del mismo color), así que no cambia de tamaño. Deshabilitado sigue con opacidad al 50 %.

**Archivos afectados:** `frontend/components/assistant/DiagnosisPanel.tsx`.

**Verificación automática:** `eslint` sin errores.

**Revisión humana:** corrección visual pedida por Lucía.

### P-129. Texto oscuro en la etiqueta "Completada"

| Campo | Valor |
|---|---|
| Fecha | 2026-11-22 |
| Autor del prompt | Lucía |
| Objetivo | Poner en negro el texto de la etiqueta "Completada" del encabezado de la sección |
| Especificación / tarea | Pantalla principal (encabezado de sección) |

**Prompt**

> "Completada" en el encabezado de arriba coloca el texto de color negro o así.

**Resultado de la IA:** la etiqueta "Completada" conserva el fondo `emerald-100` y su texto e ícono pasan de `emerald-700` a `slate-900`.

**Archivos afectados:** `frontend/components/assistant/SectionHeader.tsx`.

**Verificación automática:** `eslint` sin errores.

**Revisión humana:** corrección visual pedida por Lucía.

### P-130. Primer candidato del expediente con fondo blanco

| Campo | Valor |
|---|---|
| Fecha | 2026-11-22 |
| Autor del prompt | Lucía |
| Objetivo | Quitar el fondo azul claro del primer candidato del diagnóstico diferencial en el panel derecho |
| Especificación / tarea | ESP-005 (panel derecho) |

**Prompt**

> Este colócalo con fondo blanco (captura del primer candidato, "Lupus eritematoso sistémico").

**Resultado de la IA:** el primer candidato pasa de `bg-blue-50` a fondo blanco. Conserva el borde azul `#1e47c5`, el círculo con el número y la barra en azul (P-114), así que sigue destacando sobre los demás.

**Archivos afectados:** `frontend/components/home/PatientRecordPanel.tsx`.

**Verificación automática:** `eslint` sin errores.

**Revisión humana:** corrección visual pedida por Lucía.

### P-131. Píldora del paciente solo con el nombre

| Campo | Valor |
|---|---|
| Fecha | 2026-11-22 |
| Autor del prompt | Lucía |
| Objetivo | Quitar el ID del expediente y el divisor de la píldora del paciente de la sesión |
| Especificación / tarea | Pantalla principal (P-101) |

**Prompt**

> Elimina el id y el divisor (captura de la píldora "Hector López Andrade | PACIE00015").

**Resultado de la IA:** `SessionPatientPill` muestra solo el ícono y el nombre completo. Se quitaron el divisor "|" y el ID, también del globo que aparece al pasar el cursor. El ID se sigue viendo en el panel del expediente.

**Archivos afectados:** `frontend/components/assistant/SessionPatientPill.tsx`.

**Verificación automática:** `eslint` sin errores.

**Revisión humana:** corrección visual pedida por Lucía.

### P-132. "Cerrar sesión" con texto oscuro

| Campo | Valor |
|---|---|
| Fecha | 2026-11-22 |
| Autor del prompt | Lucía |
| Objetivo | Poner en negro u oscuro el texto de "Cerrar sesión" del menú de cuenta |
| Especificación / tarea | Pantalla principal (menú de cuenta) |

**Prompt**

> Este colócalo de texto negro o oscuro (captura de "Cerrar sesión").

**Resultado de la IA:** en `ProfileMenu`, el texto y el ícono de "Cerrar sesión" pasan de `red-700` a `slate-900`. Se conserva el fondo rojo muy claro al pasar el cursor (`red-50`), que sigue señalando que es la acción de salida. El botón "Cerrar sesión" del panel de administrador no cambia (va en blanco sobre la barra azul).

**Archivos afectados:** `frontend/components/home/ProfileMenu.tsx`.

**Verificación automática:** `eslint` sin errores.

**Revisión humana:** corrección visual pedida por Lucía.

### P-133. Textos grises más oscuros en toda la app

| Campo | Valor |
|---|---|
| Fecha | 2026-11-22 |
| Autor del prompt | Lucía |
| Objetivo | Oscurecer los textos grises para que se lean bien |
| Especificación / tarea | Interfaz general (accesibilidad, contraste) |

**Prompt**

> Coloca todos los textos que puedas de color oscuro o negro, o sea no tanto grisecito porque luego no se ve correctamente.

**Resultado de la IA:**

- Sobre fondos claros, cada gris baja dos tonos:
  - `text-slate-400` → `text-slate-600` (íconos de búsqueda, unidades del catálogo, botones de quitar);
  - `text-slate-500` → `text-slate-700` (textos secundarios, ayudas, fechas, especialidad);
  - `text-slate-600` → `text-slate-800` (descripciones, encabezados de tabla, subtítulos).
- Los textos de ejemplo de los campos quedan todos en `placeholder:text-slate-500`, más claros que el texto escrito para no confundirse con un valor.
- El botón de mostrar contraseña del login queda en `slate-700` y pasa a `slate-900` al pasar el cursor, para que el efecto se siga notando.
- **No cambian**, a propósito:
  - la barra lateral (`Sidebar`) y la barra lateral de la interfaz de salida, porque son azul marino: ahí los grises son tonos claros y oscurecerlos los haría ilegibles;
  - los separadores e íconos decorativos en `slate-300` (la "/" del encabezado, el estetoscopio de "Disponible al analizar el expediente.", la lupa de "sin resultados");
  - los estados deshabilitados (`disabled:`), que deben seguir viéndose inactivos.
- 107 clases cambiadas en 18 componentes.

**Archivos afectados:** `frontend/components/admin/` (`AdminDialog`, `AdminPanel`, `StatusDialog`), `frontend/components/assistant/` (`ChatComposer`, `ChatIntro`, `ChatMessages`, `ChatNotice`, `DiagnosisPanel`, `SectionCapture`, `SectionHeader`), `frontend/components/auth/LoginForm.tsx`, `frontend/components/home/` (`HelpMenu`, `NewPatientDialog`, `PatientRecordPanel`, `PatientSearchDialog`, `ProfileMenu`), `frontend/components/result/` (`PatientResultScreen`, `ResultSections`).

**Verificación automática:** `tsc` y `eslint` sin errores. Se revisó que ningún efecto al pasar el cursor quedara con el mismo color que el texto base.

**Revisión humana:** pendiente de revisión visual de Lucía.

### P-134. "Ver resultado del expediente" se rellena al pasar el cursor

| Campo | Valor |
|---|---|
| Fecha | 2026-11-22 |
| Autor del prompt | Lucía |
| Objetivo | Al pasar el cursor por "Ver resultado del expediente", rellenar el fondo del azul del borde y poner el texto en blanco |
| Especificación / tarea | ESP-005 (panel derecho) |

**Prompt**

> Al hacer hover en este, pon que se coloque el fondo de ese color de azul como el borde, y textos blancos.

**Resultado de la IA:** el enlace del panel derecho cambia el `hover:bg-blue-50` por `hover:bg-[#1e47c5] hover:text-white`. Al pasar el cursor, el fondo toma el azul del borde, y el texto y los dos íconos (documento y flecha) se ponen blancos. Sin el cursor sigue igual: borde y texto azules sobre blanco.

**Archivos afectados:** `frontend/components/home/PatientRecordPanel.tsx`.

**Verificación automática:** `eslint` sin errores.

**Revisión humana:** corrección visual pedida por Lucía.

### P-135. El diagnóstico diferencial muestra cuál está confirmado

| Campo | Valor |
|---|---|
| Fecha | 2026-11-22 |
| Autor del prompt | Lucía |
| Objetivo | Que la pantalla de diagnóstico diferencial diga qué candidato está confirmado y que ya se guardó en el expediente |
| Especificación / tarea | ESP-005 (RF-41, RF-42), P-111 |

**Prompt**

> En la pantalla de diagnóstico diferencial, en la parte de la interfaz de entrada, se ve un poco confuso porque no sale cuál está confirmado, o no le avisa que se confirmó ya en el expediente en el panel derecho.
>
> Elimina el borde aquí y el fondo colócalo como un gris tenue.

**Resultado de la IA:**

- **Causa:** al confirmar, la app abre la interfaz de salida. Al volver, los tres candidatos se veían iguales, todos con "Confirmar este diagnóstico", porque `DiagnosisPanel` no recibía el diagnóstico ya guardado.
- `DiagnosisPanel` recibe `confirmedName` (el `diagnosis` del paciente, que viene de `PACIENTES` y persiste al recargar).
- **Aviso arriba de la lista:** recuadro con "{enfermedad} confirmado y guardado en el expediente." y el botón "Ver resultado". Aparece aunque el diagnóstico confirmado ya no esté entre los candidatos de un análisis nuevo.
  - Primero tenía borde y fondo verde azulado. Lucía pidió quitar el borde y usar un gris tenue: queda en `bg-slate-100`, sin borde, con el ícono de palomita y el botón "Ver resultado" en verde azulado.
- **Candidato confirmado:** borde verde azulado, etiqueta "Confirmado" junto al nombre y sin botón de confirmar.
- **Los demás candidatos:** con un diagnóstico ya confirmado, el botón pasa a "Cambiar a este diagnóstico", con borde gris y fondo blanco, para no competir con el confirmado. Sin confirmado sigue "Confirmar este diagnóstico" relleno (P-128).
- El backend ya permitía cambiar el diagnóstico (`ConfirmarDiagnosticoAsync` lo reemplaza y quita el tratamiento si la enfermedad cambia), así que no hubo cambios en la API.

**Archivos afectados:** `frontend/components/assistant/DiagnosisPanel.tsx`, `frontend/components/assistant/AssistantChat.tsx`.

**Verificación automática:** `tsc` y `eslint` sin errores.

**Revisión humana:** Lucía detectó la confusión (A-24). Pendiente de su revisión visual.

### P-136. "Guardar y continuar" avanza aunque todas las secciones estén completas

| Campo | Valor |
|---|---|
| Fecha | 2026-11-22 |
| Autor del prompt | Lucía |
| Objetivo | Que "Guardar y continuar" siempre lleve a la siguiente sección, aunque no se haya modificado nada |
| Especificación / tarea | ESP-005 (captura por secciones), P-103 |

**Prompt**

> ¿Por qué cuando voy a un paso, por ejemplo el de Comorbilidades, y no modifico nada y le doy en "Guardar y continuar", no pasa nada? ¿Cómo lo soluciono?

**Resultado de la IA:**

- **Causa:** tras guardar, `HomeScreen` saltaba a la primera sección sin completar. Con las seis completas (6/6) no había ninguna y se quedaba en la misma sección. El guardado sí ocurría, pero en pantalla no cambiaba nada.
- **Corrección:** `nextSectionAfterSave` lleva a la primera sección sin completar y, si ya están todas completas (el médico está revisando o corrigiendo), a la siguiente en orden. Por ejemplo, de Comorbilidades pasa a Síntomas.
- **Segundo problema encontrado:** guardar sin cambios marcaba el análisis como desactualizado ("Los hallazgos cambiaron. Vuelve a analizar…"). Ahora se compara lo guardado antes y después (enfermedad preexistente y hallazgos con su valor) y solo se desactualiza si algo cambió.

**Archivos afectados:** `frontend/components/home/HomeScreen.tsx`.

**Verificación automática:** `tsc` y `eslint` sin errores.

**Revisión humana:** Lucía detectó el problema (A-25). Pendiente de que lo pruebe.

### P-137. Indicación para analizar en el diagnóstico diferencial vacío

| Campo | Valor |
|---|---|
| Fecha | 2026-11-22 |
| Autor del prompt | Lucía |
| Objetivo | Que la pantalla de diagnóstico diferencial no se vea vacía antes del primer análisis |
| Especificación / tarea | ESP-005, P-127 |

**Prompt**

> Creé un nuevo paciente, ¿me puedes explicar por qué aquí no sale nada? Ya llené todo los datos que se necesitan, gracias.

**Resultado de la IA:**

- **Causa:** el diagnóstico diferencial aparece después de pulsar "Analizar expediente". En P-127 la IA quitó el texto "Cuando termines de capturar, analiza el expediente." y ocultó el cuerpo de la tarjeta antes del primer análisis, así que la tarjeta quedaba vacía y no indicaba qué hacer.
- La tarjeta vuelve a tener cuerpo antes del análisis, con una sola línea: "Pulsa **Analizar expediente** para ver las enfermedades más probables.", junto al ícono del microscopio.
- En este paso, el texto del campo de mensaje dice "Analiza el expediente en la tarjeta de arriba" en lugar de "Captura los datos en la tarjeta de arriba".

**Archivos afectados:** `frontend/components/assistant/DiagnosisPanel.tsx`, `frontend/components/assistant/AssistantChat.tsx`.

**Verificación automática:** `tsc` y `eslint` sin errores.

**Revisión humana:** Lucía detectó la pantalla vacía (A-26).

### P-138. Sin campo de chat en la interfaz de entrada

| Campo | Valor |
|---|---|
| Fecha | 2026-11-22 |
| Autor del prompt | Lucía |
| Objetivo | Quitar el campo de mensaje del chat durante la captura del expediente y conservarlo en la introducción |
| Especificación / tarea | ESP-003 (introducción), ESP-005 (interfaz de entrada) |

**Prompt**

> Vamos a quitar este, porque no tendremos un LLM o IA formal, ya que el motor de inferencia será de nuestra propiedad. Quitaremos lo del chat, pero solo para la interfaz de entrada; para la introducción no.

**Resultado de la IA:**

- `AssistantChat` muestra `ChatComposer` solo sin paciente seleccionado, es decir, en la introducción guiada (ESP-003). Con paciente, en la captura y el diagnóstico diferencial, ya no aparece el campo de mensaje: todo se hace en las tarjetas.
- Se quitaron los textos del campo de mensaje que solo se usaban con paciente ("Captura los datos en la tarjeta de arriba" y "Analiza el expediente en la tarjeta de arriba", de P-127 y P-137).
- La introducción (bienvenida, recorrido y su campo de mensaje) no cambia.

**Archivos afectados:** `frontend/components/assistant/AssistantChat.tsx`.

**Verificación automática:** `tsc` y `eslint` sin errores.

**Revisión humana:** decisión de Lucía: el motor de inferencia es propio y no habrá un LLM en la captura.

### P-139. El desenfoque del banner ya no cubre los hallazgos

| Campo | Valor |
|---|---|
| Fecha | 2026-11-22 |
| Autor del prompt | Lucía |
| Objetivo | Mantener borroso el banner de cada tipo de hallazgo sin que el desenfoque se extienda sobre la lista de hallazgos |
| Especificación / tarea | Panel derecho (expediente) |

**Prompt**

> ¿Puedes arreglar eso de que se ve borroso y se lleva el texto de paso? O sea, mantenlo borroso pero sin afectar lo de abajo.

**Resultado de la IA:**

- **Causa:** el banner se dibuja ampliado (`scale-150`) y con desenfoque de 24 px, y su franja no recortaba lo que sobresalía. El color se extendía hacia abajo, sobre los primeros hallazgos ("Albúmina", "BUN aumentado"), y los dejaba deslavados.
- La franja del banner lleva `overflow-hidden`: el desenfoque y el efecto al pasar el cursor siguen igual, pero quedan dentro de la franja. Los hallazgos de abajo se ven sobre fondo blanco.

**Archivos afectados:** `frontend/components/home/PatientRecordPanel.tsx`.

**Verificación automática:** `eslint` sin errores.

**Revisión humana:** corrección visual pedida por Lucía.

### P-140. Textos y botones del panel de diagnóstico diferencial

| Campo | Valor |
|---|---|
| Fecha | 2026-11-23 |
| Autor del prompt | Antonio Castañeda |
| Herramienta / modelo | Claude Code (extensión VS Code), Claude Opus 5.5 |
| Objetivo | Cambiar los textos de los botones y mensajes del panel de diagnóstico diferencial |
| Especificación / tarea | ESP-005 (captura y análisis), ESP-006 (interfaz de salida), P-114, P-135, P-137 |

**Prompt**

> Ayúdame a realizar los siguientes cambios de textos y botones. Son cambios pequeños y no dependen de nadie. En el panel de diagnóstico diferencial (`DiagnosisPanel.tsx`):
>
> - El botón "Analizar expediente" cambia a "Generar diagnóstico y tratamiento".
> - El botón "Volver a analizar" cambia a "Guardar".
> - Borra el mensaje "Pulsa Analizar expediente para ver las enfermedades más probables" y sus referencias.
> - El mensaje "…confirmado y guardado en el expediente" cambia a "Revisado por médico internista".
>
> Esto por ahora.

**Resultado de la IA:**

- Etiqueta del botón del análisis: sin análisis dice "Generar diagnóstico y tratamiento"; con el análisis desactualizado dice "Guardar". El estado "Análisis al día" no cambia.
- Se quitó la línea que se mostraba antes del primer análisis (P-137), junto con su ícono. El ícono del microscopio se sigue usando en el botón.
- El aviso del diagnóstico confirmado dice "{enfermedad} revisado por médico internista." Más adelante lo reemplaza P-141.

**Archivos afectados:** `frontend/components/assistant/DiagnosisPanel.tsx`.

**Verificación automática:** no se ejecutaron `tsc` ni `eslint`: las dependencias del frontend no estaban instaladas en ese momento.

**Revisión humana:** Pendiente de revisión visual.

### P-141. Envío a validación del médico internista y validación del comité (simulada)

| Campo | Valor |
|---|---|
| Fecha | 2026-11-23 |
| Autor del prompt | Antonio Castañeda |
| Herramienta / modelo | Claude Code (extensión VS Code), Claude Opus 5.5 |
| Objetivo | Dejar claro que el diagnóstico confirmado lo valida el médico internista y mostrar la validación del comité, por ahora simulada |
| Especificación / tarea | ESP-006 (interfaz de salida), P-112, P-140 |

**Prompt**

> Ahora vamos a hacer otra rama para estos cambios:
>
> - El mensaje "Los hallazgos cambiaron. Vuelve a analizar antes de confirmar" cambia a "Los hallazgos cambiaron. Actualiza el expediente antes de confirmar".
> - Agrega el mensaje "Con diagnóstico validado por el Comité Interconsulta Especialidad". Por ahora este mensaje será simulado, pero debe estar agregado.
> - Agrega también un mensaje como "Ha sido enviado a validación por el médico internista". Me refiero a la parte de confirmar los diagnósticos: eso lo debe validar el médico internista, no nosotros. Nosotros solo recibiremos el diagnóstico diferencial confirmado por el médico internista.
>
> Por ahora solo es ese texto.

**Resultado de la IA:**

- Aviso de análisis desactualizado: "Los hallazgos cambiaron. Actualiza el expediente antes de confirmar."
- El recuadro del diagnóstico confirmado dice "{enfermedad}: enviado a validación por el médico internista." y, debajo, "Con diagnóstico validado por el Comité de Interconsulta de Especialidad."
- La línea del comité es **simulada**: se muestra siempre y está marcada con un comentario `SIMULADO` en el código.
- Se quitó "revisado por médico internista" (P-140), porque contradecía que el diagnóstico apenas se envía a validación.
- La lógica no cambió: el médico sigue confirmando en la aplicación; solo cambian los textos.

**Archivos afectados:** `frontend/components/assistant/DiagnosisPanel.tsx`.

**Verificación automática:** no se ejecutaron `tsc` ni `eslint`.

**Revisión humana:** Pendiente de revisión visual. La validación real del médico internista y del comité queda por definir.

### P-142. Textos del expediente y de la interfaz de salida

| Campo | Valor |
|---|---|
| Fecha | 2026-11-23 |
| Autor del prompt | Antonio Castañeda |
| Herramienta / modelo | Claude Code (extensión VS Code), Claude Opus 5.5 |
| Objetivo | Alinear el aviso del expediente con el nuevo texto del panel y quitar la frase del médico tratante en la interfaz de salida |
| Especificación / tarea | ESP-005 (panel del expediente), ESP-006 (interfaz de salida), P-141 |

**Prompt**

> Vamos con este cambio ahora:
>
> - En el expediente (`PatientRecordPanel.tsx`): "Vuelve a analizar en Diagnóstico diferencial" cambia a "Actualiza el expediente en Diagnóstico diferencial".
> - En la interfaz de salida (`ResultSections.tsx`), en la sección de Diagnóstico: quita "Confirmado por el médico tratante a partir del diagnóstico diferencial".

**Resultado de la IA:**

- El aviso del expediente dice "Los hallazgos cambiaron: actualiza el expediente en «Diagnóstico diferencial»."
- La sección Diagnóstico de la interfaz de salida muestra solo el nombre de la enfermedad, sin la línea del médico tratante.

**Archivos afectados:** `frontend/components/home/PatientRecordPanel.tsx`, `frontend/components/result/ResultSections.tsx`.

**Verificación automática:** no se ejecutaron `tsc` ni `eslint`.

**Revisión humana:** Pendiente de revisión visual.

### P-143. Pantalla de inicio según el rol: tratante e internista

| Campo | Valor |
|---|---|
| Fecha | 2026-11-23 |
| Autor del prompt | (por confirmar) |
| Objetivo | Que cada rol médico tenga su propia pantalla según sus credenciales, con el internista aplazado |
| Especificación / tarea | 3.2 Login y rutas; ESP-007 (RF-52) |

**Prompt**

> Volviendo al tema de los roles, dejemos todo listo para médico tratante y para internista; hay que dejarlo listo ya que, según las credenciales, es como se mostrará la página. Mientras tanto, el internista se aplazará por el momento.

**Resultado de la IA:**

- `HOME_ROUTE_BY_ROLE`: `T → /home`, `I → /internista`, `A → /admin`. El login lleva a cada cuenta a la pantalla de su rol y la capa de carga dice a cuál va.
- `proxy.ts`: `/home` y `/patients` quedan solo para el tratante; la nueva `/internista` solo para el internista. Quien abre una pantalla de otro rol vuelve a la suya.
- Nueva ruta `/internista` (`components/internist/InternistScreen.tsx`): saluda con el nombre del médico, avisa que su espacio está en preparación y permite cerrar sesión.
- `HomeScreen` y `AdminPanel` también mandan a la pantalla del rol si la sesión trae otro rol (cubre un rol que cambió con la sesión abierta).
- El backend no cambió: los endpoints médicos siguen aceptando `T` e `I`.

**Archivos afectados:** `frontend/types/auth.ts`, `frontend/proxy.ts`, `frontend/app/(internista)/internista/page.tsx`, `frontend/components/internist/InternistScreen.tsx`, `frontend/components/home/HomeScreen.tsx`, `frontend/components/admin/AdminPanel.tsx`, `frontend/components/auth/LoginForm.tsx`, `specs/especificaciones/03-inicio-sesion.md`, `specs/especificaciones/10-panel-administrador.md`.

**Verificación automática:** `tsc --noEmit` y `eslint` sin errores. Por HTTP contra el frontend: el tratante 123456 abre `/home` y `/patients` (200) y es redirigido desde `/internista` y `/admin` (307); el internista 654322 abre `/internista` (200) y es redirigido desde `/home`, `/patients` y `/admin` (307).

**Revisión humana:** pendiente.
