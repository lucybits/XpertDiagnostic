# 04. Pruebas TDD (Given-When-Then)

Este documento reúne los casos de prueba del inicio de sesión en formato **Given-When-Then** (Dado-Cuando-Entonces). Cada caso se redacta **antes** de programar la funcionalidad y después se ejecuta manualmente.

## Procedimiento

1. **Redactar el caso** en este documento, con su resultado esperado. Mientras el código no existe, el caso falla (fase *roja*).
2. **Programar** lo mínimo necesario para cumplirlo (fase *verde*).
3. **Ejecutar el caso manualmente**:
   - Casos de API: con Swagger (`http://localhost:5140/swagger`) o con el archivo `backend/XpertDiagnostic.Api/XpertDiagnostic.Api.http`.
   - Casos de interfaz: en el navegador, en `http://localhost:3000/login`.
4. **Registrar el resultado** en la tabla del final del documento.
5. **Refactorizar** si hace falta y repetir la ejecución para confirmar que sigue pasando.

Algunos casos también tienen una prueba automatizada en `backend/XpertDiagnostic.Tests`. Se ejecutan con:

```powershell
dotnet test backend\XpertDiagnostic.sln --filter "Categoria!=Integracion"
```

El filtro omite `UnitTest1.PT02`, que es de integración y necesita la API ejecutándose en `http://localhost:5140`. Para correrla, primero inicia la API y luego ejecuta `dotnet test backend\XpertDiagnostic.sln` sin filtro.

## Datos de prueba

| Dato | Valor |
|---|---|
| Usuario con contraseña BCrypt | ID y contraseña de un usuario real de la tabla `USUARIOS` (no se escriben aquí) |
| ID inexistente | `999999` |
| Contraseña incorrecta | `Incorrecta123` |

---

## Backend: `POST /api/auth/login`

### PT01. Inicio de sesión correcto

- **Given** un usuario registrado en `USUARIOS` con su contraseña guardada como hash BCrypt.
- **When** envía su ID y su contraseña correctos.
- **Then** la API responde **200** con `usuarioId`, `rol`, `token` y `expiraEn` (fecha futura).

Prueba automatizada: `AuthServiceTests.LoginAsync_CredencialesCorrectas_DevuelveTokenYRol`.

### PT02. Contraseña incorrecta

- **Given** un usuario registrado.
- **When** envía su ID con la contraseña `Incorrecta123`.
- **Then** la API responde **401** con `{ "error": "ID o contraseña incorrectos. Vuelve a intentarlo." }` y no modifica datos.

Pruebas automatizadas: `UnitTest1.PT02_ContrasenaIncorrecta_DebeRetornar401` (integración) y `AuthServiceTests.LoginAsync_ContrasenaIncorrecta_DevuelveNullYNoModificaDatos`.

### PT03. Usuario inexistente

- **Given** que no existe un usuario con ID `999999`.
- **When** se intenta iniciar sesión con ese ID.
- **Then** la API responde **401** con el mismo mensaje que PT02, para no revelar qué IDs existen.

Prueba automatizada: `AuthServiceTests.LoginAsync_UsuarioInexistente_DevuelveNull`.

### PT04. Datos inválidos

- **Given** una solicitud con `usuarioId` igual a `0` o con `password` vacía.
- **When** se envía al endpoint.
- **Then** la API responde **400** con `{ "error": "Datos inválidos" }`, sin consultar la base de datos.

Prueba automatizada: `AuthServiceTests.LoginAsync_PrecondicionIncumplida_LanzaArgumentException`, que verifica la precondición del servicio.

### PT05. Contraseña de más de 72 caracteres

- **Given** una contraseña de 73 caracteres o más (límite de BCrypt).
- **When** se envía al endpoint.
- **Then** la API responde **400**.

Prueba automatizada: `AuthServiceTests.LoginAsync_ContrasenaDeMasDe72Caracteres_LanzaArgumentException`.

### PT06. Migración de una contraseña heredada en texto plano

- **Given** un usuario cuya columna `PASS` todavía contiene la contraseña en texto plano.
- **When** inicia sesión con la contraseña correcta.
- **Then** la API responde **200** y la columna `PASS` queda con un hash BCrypt que empieza con `$2`. Se comprueba en SSMS con `SELECT PASS FROM USUARIOS WHERE IdUSUARIO = <id>`.

Pruebas automatizadas: `AuthServiceTests.LoginAsync_ContrasenaHeredadaCorrecta_GuardaHashBCrypt` y `PasswordCredentialVerifierTests`.

### PT07. Base de datos no disponible

- **Given** que el servicio de SQL Server está detenido.
- **When** se intenta iniciar sesión.
- **Then** la API responde **503** con un mensaje genérico, sin detalles internos como la cadena de conexión o el stack trace. El detalle solo aparece en el log del servidor.

### PT08. Falta la clave JWT

- **Given** que `Jwt:Key` no está configurada en user-secrets ni en las variables de entorno.
- **When** se inicia la API.
- **Then** la API no arranca y muestra un mensaje que indica cómo configurar la clave.

---

## Frontend: pantalla `/login`

### PT09. Campos vacíos

- **Given** el formulario vacío.
- **When** el usuario presiona **Entrar**.
- **Then** aparece "Ingresa tu ID y contraseña.", los dos campos se marcan en rojo con `aria-invalid="true"` y **no** se envía ninguna solicitud. Se comprueba en la pestaña Red del navegador.

### PT10. Prevención: el ID solo acepta números

- **Given** el campo de ID.
- **When** el usuario escribe letras o símbolos.
- **Then** el campo descarta todo lo que no sea dígito y no acepta más de 10 caracteres.

### PT11. Estado de carga y prevención de doble envío

- **Given** un ID y una contraseña escritos.
- **When** el usuario presiona **Entrar** y, mientras espera, vuelve a presionarlo.
- **Then** el botón se deshabilita y muestra la animación de carga, el formulario tiene `aria-busy="true"`, el selector Médico/Administrador queda deshabilitado y solo se envía **una** solicitud.

### PT12. Retroalimentación ante credenciales incorrectas

- **Given** un ID existente y una contraseña incorrecta.
- **When** el usuario envía el formulario.
- **Then** aparece la alerta roja "ID o contraseña incorrectos. Vuelve a intentarlo.", el lector de pantalla la anuncia (`role="alert"`) y los dos campos se marcan como inválidos.

### PT13. Inicio de sesión correcto y cookie segura

- **Given** credenciales correctas.
- **When** el usuario envía el formulario.
- **Then** aparece "¡Inicio de sesión exitoso!" en verde. En DevTools, en **Application → Cookies**, existe `xd_session` con *HttpOnly* y *SameSite=Strict*, y la respuesta JSON **no** contiene el token.

### PT14. Uso completo con teclado

- **Given** la pantalla de inicio de sesión cargada.
- **When** el usuario navega solo con el teclado:
  - **Tab** para moverse;
  - **flechas** en el selector de tipo de cuenta;
  - **Espacio** en "Mostrar contraseña" y en "Recuérdame";
  - **Enter** para enviar.
- **Then** todos los controles reciben foco visible en este orden: selector de cuenta, ID, contraseña, mostrar contraseña, recuérdame, Entrar. El formulario se envía con Enter.

### PT15. Backend apagado

- **Given** que la API ASP.NET Core no se está ejecutando.
- **When** el usuario envía el formulario.
- **Then** aparece "No se pudo iniciar sesión. Inténtalo de nuevo." y la página no se rompe.

### PT16. Corregir después de un error

- **Given** que se muestra un mensaje de error.
- **When** el usuario modifica el ID o la contraseña.
- **Then** el mensaje desaparece con una transición y los campos dejan de estar marcados en rojo.

---
