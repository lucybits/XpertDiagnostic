# 06. Especificación: bienvenida guiada del asistente

| Campo | Valor |
|---|---|
| Identificador | ESP-003 |
| Origen | Petición de Lucía (P-59): un "camino" que el asistente muestra la primera vez que un médico entra con su cuenta. |
| Estado | Implementada, pendiente de la ejecución manual de pruebas |
| Tareas | [tareas/inicio-sesion.md](../tareas/inicio-sesion.md), T43 a T45 |
| Casos de prueba | Sección 5 de este documento, PT29 a PT34 |

## 1. Objetivo

Explicar al médico, la primera vez que usa XpertDiagnostic, cómo trabaja el asistente y que la decisión clínica siempre es suya. Las veces siguientes, el chat empieza vacío.

## 2. Decisiones de Lucía

- **"Primera vez" se cuenta por cuenta,** no por navegador: se guarda en `USUARIOS.BienvenidaVista`.
- **Recorrido guiado en 4 pasos con botones;** el texto exacto se puede afinar después.

## 3. Requisitos funcionales

| ID | Requisito |
|---|---|
| RF-17 | `USUARIOS.BienvenidaVista` (`BIT NOT NULL`, por defecto 0) indica si el usuario ya completó la bienvenida. |
| RF-18 | `GET /api/doctors/me` incluye `bienvenidaVista`. |
| RF-19 | `POST /api/doctors/me/welcome` marca la bienvenida como vista para el usuario del token. Responde 204, o 404 si la cuenta no existe. Repetirlo no cambia nada. |
| RF-20 | ~~Si `bienvenidaVista` es falso, el chat muestra el recorrido. Si es verdadero, el chat empieza vacío.~~ Reemplazado por RF-26 (P-71). |
| RF-21 | Al pulsar "Acepto" en el aviso clínico, el frontend marca la bienvenida como vista. Si falla la red, el recorrido sigue y se volverá a mostrar en el próximo ingreso. |
| RF-22 | El último paso ofrece "Buscar paciente", que abre el buscador. |
| RF-23 | La bienvenida no arranca sola: empieza cuando el médico envía su primer mensaje, que se permite aunque no haya paciente (P-65). |
| RF-24 | Mientras el chat no tiene mensajes, se muestra una portada con logo, título y subtítulo que invita a escribir, sin sugerencias en botones (P-65, A-12). |
| RF-25 | Durante el recorrido, el médico puede responder por escrito cuando el asistente termina un paso; su mensaje avanza al paso siguiente, igual que el botón. Responder al aviso clínico cuenta como aceptarlo. El último paso se resuelve con "Buscar paciente" (P-69). |
| RF-26 | Sin paciente, el primer mensaje del médico arranca siempre el recorrido completo, aunque la cuenta ya lo haya visto. `bienvenidaVista` solo registra que se aceptó el aviso clínico (P-71; reemplaza el recordatorio de P-70). |
| RF-27 | Mientras el asistente piensa o escribe, el botón de enviar se cambia por "Detener respuesta". Al detenerlo se corta la burbuja en la palabra actual ("Respuesta detenida") y el siguiente mensaje del médico retoma el recorrido (P-83). |

**Recorrido:**

| Paso | Mensaje del asistente | Botón |
|---|---|---|
| 1 | Hola, {nombre}. Soy XpertDiagnostic, tu asistente de apoyo clínico. | Continuar |
| 2 | Explicación en 5 burbujas seguidas (P-62). Ver la tabla siguiente. | Entendido |
| 3 | Mis sugerencias son orientativas y pueden contener errores. La decisión clínica siempre es tuya. | Acepto |
| 4 | Para empezar, busca a un paciente registrado o registra uno nuevo: solo necesito su nombre completo y su edad. El resto lo iremos capturando juntos, sección por sección. (P-99, ESP-004) | Buscar paciente · Nuevo paciente |

**Burbujas del paso 2:**

| # | Contenido |
|---|---|
| 2.1 | El expediente se divide en dos etapas, en orden, una sección a la vez. |
| 2.2 | Antecedentes: enfermedades preexistentes y comorbilidades. En cada sección se elige de la base de conocimiento (P-103). |
| 2.3 | Evaluación clínica: síntomas, signos y estudios de laboratorio. Los valores medidos se anotan; el sistema muestra las unidades de cada uno (P-103). |
| 2.4 | Cada sección se desbloquea al guardar la anterior. El avance se ve en la barra lateral y los hallazgos se acumulan en el expediente. |
| 2.5 | Se comparan los hallazgos con la base de conocimiento y se propone un diagnóstico diferencial ordenado, con los datos que apoyan cada opción. Con el diagnóstico que elija el médico se sugieren estudios complementarios, plan de tratamiento y seguimiento. |

Las burbujas del paso 2 usan formato de chat: negritas y viñetas con `lib/chatMarkup.ts` (P-96). Las burbujas seguidas del asistente muestran el avatar y el nombre solo en la primera. Cada respuesta del médico aparece como su mensaje en el chat antes del siguiente paso del asistente.

**Ritmo (P-60):**

- Antes de cada mensaje, el asistente "piensa" y muestra `public/loading.svg` sin burbuja (`role="status"`: "XpertDiagnostic está escribiendo"). El tiempo depende del paso: 1.3 s, 2.1 s, 1.7 s y 1.0 s.
- Luego escribe el mensaje palabra por palabra, con barrido (`TypewriterText`):
  - cada paso tiene su ritmo medio por palabra (105, 85, 125 y 115 ms);
  - cada palabra varía ±30 %;
  - hay pausas de 170 ms tras una coma y de 360 ms tras un punto o dos puntos.
- El botón del paso aparece cuando termina de escribirse.

## 4. Requisitos no funcionales

- **Accesibilidad:**
  - los botones de cada paso son `<button>` con texto visible;
  - el último mensaje se mantiene a la vista;
  - la entrada de cada mensaje respeta la preferencia de movimiento reducido; con ella activa, el texto aparece completo de una vez;
  - el texto completo está en el DOM desde el inicio, así que el lector de pantalla no lo lee a trozos.
- **Errores:** marcar la bienvenida nunca interrumpe el chat. El fallo solo se registra.

## 5. Casos de prueba (Given-When-Then)

Los marcados con **[auto]** tienen prueba xUnit en `DoctorServiceTests.cs`.

### PT29. Marcar la bienvenida [auto]

- **Given** el usuario 1 con `BienvenidaVista = false`.
- **When** se marca su bienvenida.
- **Then** el resultado es verdadero y `BienvenidaVista` pasa a `true`.

### PT30. Marcar la bienvenida de una cuenta inexistente [auto]

- **Given** que no existe el usuario 999.
- **When** se marca su bienvenida.
- **Then** el resultado es falso (la API responde 404).

### PT31. El perfil informa la bienvenida [auto]

- **Given** el usuario 1 con `BienvenidaVista = true`.
- **When** se consulta su perfil.
- **Then** `BienvenidaVista` es `true`.

### PT32. Primera vez

- **Given** un médico recién registrado.
- **When** inicia sesión y abre `/home`.
- **Then** el chat muestra el paso 1 con el botón "Continuar".

### PT33. Recorrido completo

- **Given** el recorrido en el paso 1.
- **When** el médico pulsa Continuar, Entendido y Acepto.
- **Then** cada respuesta aparece como su mensaje y el asistente muestra el siguiente paso. Al final se ve "Buscar paciente", que abre el buscador.

### PT34. Segunda vez

- **Given** que el médico ya pulsó "Acepto" una vez.
- **When** vuelve a iniciar sesión, en este u otro navegador.
- **Then** el chat empieza vacío, sin el recorrido.
