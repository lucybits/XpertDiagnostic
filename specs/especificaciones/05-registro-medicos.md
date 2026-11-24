# 05. Especificación: médicos y cuentas de usuario

| Campo | Valor |
|---|---|
| Identificador | ESP-002 |
| Origen | Petición de Lucía (P-38): identificar al médico que inicia sesión y permitir que un administrador registre médicos con su cuenta. |
| Estado | Implementada, pendiente de la ejecución manual de pruebas |
| Tareas | [tareas/inicio-sesion.md](../tareas/inicio-sesion.md), T35 a T38 |
| Casos de prueba | Sección 6 de este documento, PT17 a PT28 |

## 1. Objetivo

Saber qué médico usa el sistema, mostrar su nombre y especialidad, y permitir que un administrador dé de alta médicos junto con su cuenta, sin tocar la base de datos a mano.

## 2. Historias de usuario

- **HU-06.** Como **médico**, quiero ver mi nombre y mi especialidad en la barra superior para confirmar con qué cuenta trabajo.
- **HU-07.** Como **administrador**, quiero registrar a un médico y crear su cuenta en un solo paso.
- **HU-08.** Como **institución**, quiero que solo un administrador pueda crear cuentas.

## 3. Modelo de datos

- **`MEDICOS`**:
  - `IdMedico`: número de empleado o identificador institucional;
  - `NombreCompleto`;
  - `Especialidad`;
  - `CedulaProfesional`: única, de 7 u 8 dígitos.
- **`USUARIOS`**:
  - `IdUSUARIO`;
  - `PASS`: hash BCrypt;
  - `ROL`: `T` médico tratante, `I` médico internista, `A` administrador;
  - `IdMEDICO`: llave foránea a `MEDICOS`;
  - `IdAREA`: opcional, sin llave foránea.
- **Convención:** la cuenta de un médico usa el mismo número que su registro, es decir, `IdUSUARIO = IdMEDICO`. Con ese número inicia sesión.

## 4. Requisitos funcionales

| ID | Requisito | Historia |
|---|---|---|
| RF-10 | `GET /api/doctors/me` devuelve el ID, el rol, el nombre y la especialidad del usuario autenticado. Sin sesión válida responde 401. | HU-06 |
| RF-11 | La barra superior muestra el nombre y la especialidad del médico. Si no hay sesión o no se pudo consultar, muestra los indicadores `{nombre}` y `{especialidad}`. | HU-06 |
| RF-12 | `POST /api/doctors` crea el médico y su cuenta en una sola operación. Si falla una parte, no se guarda nada. | HU-07 |
| RF-13 | La contraseña de la cuenta nueva se guarda como hash BCrypt, nunca en texto plano. | HU-07, HU-08 |
| RF-14 | Si el ID ya existe, como médico o como usuario, responde 409 con un mensaje claro y no guarda nada. Lo mismo ocurre si la cédula profesional ya existe. | HU-07 |
| RF-15 | Solo el rol `A` puede usar `POST /api/doctors`. Sin sesión responde 401 y con otro rol responde 403. | HU-08 |
| RF-16 | El menú de cuenta muestra "Registrar médico" solo a los administradores. | HU-07, HU-08 |

**Reglas de los datos del alta,** validadas en el navegador y otra vez en el servidor:

- **ID:** número entero de 1 a 2 147 483 647.
- **Nombre completo:** de 3 a 120 caracteres.
- **Especialidad:** de 2 a 80 caracteres.
- **Cédula profesional:** 7 u 8 dígitos.
- **Contraseña:** de 8 a 72 caracteres.
- **Rol:** las altas del panel crean cuentas `T`; las cuentas `I` también son médicos y requieren su registro en `MEDICOS`.

## 5. Requisitos no funcionales

- Mismo tratamiento de la sesión que ESP-001:
  - el token viaja en la cookie httpOnly `xd_session`;
  - las rutas de Next.js lo reenvían al backend como `Authorization: Bearer`;
  - el navegador nunca lo lee.
- Formulario accesible:
  - etiquetas visibles;
  - los errores se asocian a cada campo con `aria-describedby`;
  - el resultado se anuncia con `role="status"` o `role="alert"`.

## 6. Casos de prueba (Given-When-Then)

Los casos marcados con **[auto]** tienen una prueba xUnit en `DoctorServiceTests.cs`. Los demás se ejecutan a mano.

### PT17. Registrar un médico con su cuenta [auto]

- **Given** un ID y una cédula que no existen.
- **When** el administrador registra al médico tratante.
- **Then** se guardan el médico y un usuario con el mismo ID. El usuario tiene rol `T` y la contraseña cifrada con BCrypt, distinta del texto escrito.

### PT18. ID repetido [auto]

- **Given** que ya existe un médico o un usuario con el ID 1.
- **When** se intenta registrar otro médico con el ID 1.
- **Then** el resultado es "ID duplicado" y no se guarda nada.

### PT19. Cédula repetida [auto]

- **Given** que ya existe un médico con la cédula 1234567.
- **When** se registra otro médico con esa cédula.
- **Then** el resultado es "cédula duplicada" y no se guarda nada.

### PT20. Espacios sobrantes [auto]

- **Given** un nombre escrito como `"  Ana   López "`.
- **When** se registra.
- **Then** se guarda como `"Ana López"`.

### PT21. Perfil del usuario autenticado [auto]

- **Given** el usuario 1, enlazado al médico 1.
- **When** se consulta su perfil.
- **Then** se devuelven su ID, su rol, su nombre y su especialidad.

### PT22. Perfil inexistente [auto]

- **Given** un ID sin usuario.
- **When** se consulta su perfil.
- **Then** el resultado es vacío (la API responde 404).

### PT23. Alta sin ser administrador

- **Given** una sesión con rol `T` o `I`.
- **When** se envía `POST /api/doctors`.
- **Then** la API responde 403 y el formulario muestra "Solo un administrador puede registrar médicos".

### PT24. Alta sin sesión

- **Given** que no existe la cookie `xd_session`.
- **When** se envía el formulario.
- **Then** la respuesta es 401 y el formulario pide iniciar sesión de nuevo.

### PT25. Validación del formulario

- **Given** el formulario vacío.
- **When** el administrador pulsa "Registrar médico".
- **Then** cada campo inválido muestra su mensaje debajo, se marca con `aria-invalid` y recibe el foco el primero con error. No se envía nada.

### PT26. Contraseñas distintas

- **Given** que "Contraseña" y "Confirmar contraseña" no coinciden.
- **When** se envía.
- **Then** aparece "Las contraseñas no coinciden" y no se envía nada.

### PT27. Nombre en la barra superior

- **Given** una sesión válida del médico 1.
- **When** se abre `/home`.
- **Then** la barra superior muestra su nombre y su especialidad en lugar de `{nombre}` y `{especialidad}`.

### PT28. Opción solo para administradores

- **Given** una sesión con rol `T` o `I`.
- **When** se abre el menú de cuenta.
- **Then** no aparece "Registrar médico". Con rol `A` sí aparece y lleva a `/doctors/new`.
