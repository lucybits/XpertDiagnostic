# 10. Especificación: panel de administración

| Campo | Valor |
|---|---|
| Identificador | ESP-007 |
| Origen | Petición de Lucía (P-116): panel de administrador para crear cuentas de médicos con su cédula profesional y su contraseña; cada apartado del login solo acepta su rol; rutas protegidas y persistencia cuidada. |
| Estado | Implementada; pendiente la ejecución manual de PT89 a PT94 (incluye roles T/I) |
| Tareas | [tareas/inicio-sesion.md](../tareas/inicio-sesion.md), T60 a T66 |
| Casos de prueba | Sección 7 de este documento, PT72 a PT94 |
| Reemplaza | La pantalla `/doctors/new` y `POST /api/doctors` de ESP-002 (el alta ahora vive en el panel) |

## 1. Objetivo

Dar al administrador un lugar propio para gestionar las cuentas de los médicos sin tocar la base de datos a mano, y separar los dos apartados del inicio de sesión: el de **Médico** solo deja entrar a médicos y el de **Administrador** solo a administradores.

## 2. Historias de usuario

- **HU-20.** Como **administrador**, quiero registrar a un médico con su ID, nombre, especialidad, cédula profesional y una contraseña inicial, para que pueda entrar al sistema.
- **HU-21.** Como **administrador**, quiero ver, buscar y corregir los datos de los médicos registrados.
- **HU-22.** Como **administrador**, quiero asignar una contraseña nueva a un médico que olvidó la suya.
- **HU-23.** Como **administrador**, quiero desactivar la cuenta de un médico que ya no debe entrar, sin borrar sus datos, y poder reactivarla.
- **HU-24.** Como **institución**, quiero que el apartado Médico del login solo acepte médicos y el apartado Administrador solo administradores.
- **HU-25.** Como **institución**, quiero que una cuenta desactivada pierda el acceso de inmediato, aunque tenga una sesión abierta.
- **HU-26.** Como **administrador**, quiero cambiar mi propia contraseña.

## 3. Modelo de datos (`CreateDoctorsAndUsersTables.sql`)

Cambios en `USUARIOS`, aplicados sin perder registros y dentro de una transacción:

| Columna o regla | Descripción |
|---|---|
| `IdMEDICO INT NULL` | Opcional solo para administradores: una cuenta de administrador ya no necesita un registro falso en `MEDICOS` con cédula inventada. |
| `Activo BIT NOT NULL DEFAULT 1` | Baja lógica. `0` impide iniciar sesión y anula las sesiones abiertas. |
| `FechaRegistro DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME()` | Alta de la cuenta, en UTC. |
| `CK_USUARIOS_ROL` | Solo admite `T`, `I` y `A`; las cuentas existentes `M` se migran a `T`. |
| `CK_USUARIOS_MEDICO_ROL` | `T` e `I` requieren `IdMEDICO`; `A` puede tenerlo nulo. |
| `CK_USUARIOS_MEDICO_ID` | `IdMEDICO IS NULL OR IdMEDICO = IdUSUARIO`: el médico inicia sesión con su propio número. |
| `FK_USUARIOS_MEDICOS` | Se conserva (se quita y se vuelve a crear para poder cambiar la columna). |

Cuenta de administrador de prueba (`SeedAdminAccount.sql`): **ID 654321, contraseña `admin`**, rol `A`, sin médico, guardada como hash BCrypt. El script no la sobrescribe si ya existe.

## 4. Requisitos funcionales

| ID | Requisito |
|---|---|
| RF-50 | El login envía el apartado elegido (`T` para Médico o `A` para Administrador). El apartado Médico acepta cuentas `T` e `I`; el JWT conserva el rol real. Si la contraseña es correcta pero la cuenta es de otro grupo, responde 403 con el apartado correcto. Con contraseña incorrecta siempre responde el 401 genérico (no se revela el rol ni el estado). |
| RF-51 | Una cuenta desactivada no puede entrar (403 "Tu cuenta está desactivada…", solo con la contraseña correcta). |
| RF-52 | Tras iniciar sesión, cada rol va a su pantalla (`HOME_ROUTE_BY_ROLE`): el médico tratante (`T`) a `/home`, el médico internista (`I`) a `/internista` y el administrador (`A`) a `/admin`. El contenido de `/internista` está aplazado; por ahora muestra un aviso de "en preparación" y permite cerrar sesión (P-140). |
| RF-53 | `/admin` lista a los médicos (cuentas de rol `T` o `I`) con ID, nombre, especialidad, cédula, fecha de alta y estado, y busca por nombre, especialidad, ID o cédula. |
| RF-54 | Registrar médico: ID (será su usuario), cédula de 7 u 8 dígitos única, nombre, especialidad y contraseña inicial de 8 a 72 caracteres (con confirmación). Médico y cuenta se guardan en una sola transacción; un ID o cédula repetidos responden 409 sin guardar nada. |
| RF-55 | Editar nombre, especialidad y cédula (el ID no cambia). Una cédula de otro médico responde 409. |
| RF-56 | Asignar contraseña nueva a un médico (se cifra con BCrypt; la anterior deja de funcionar). |
| RF-57 | Activar o desactivar la cuenta de un médico, con confirmación. No se borra ningún dato. |
| RF-58 | El administrador cambia su contraseña escribiendo la actual. |
| RF-59 | Ninguna operación del panel modifica cuentas de administrador ni devuelve contraseñas o hashes. |

## 5. Seguridad y protección de rutas

- **Backend (autoridad):** `api/admin/doctors/*` exige rol `A`; pacientes y catálogos exigen rol `T` o `I`. Además, en cada petición autenticada `SessionValidator` comprueba en `USUARIOS` que la cuenta del token exista, esté activa y conserve su rol; si no, 401. Así desactivar una cuenta cierra sus sesiones al instante.
- **Frontend:** `proxy.ts` (el middleware de Next.js 16) redirige sin sesión a `/login` y deja a cada rol solo en sus pantallas: `/home` y `/patients` para el tratante, `/internista` para el internista y `/admin` para el administrador. Quien abre una pantalla de otro rol va a la de inicio del suyo. Lee el token sin verificar la firma (la clave solo la tiene el backend), así que es una comprobación optimista; los datos siempre los protege el backend.
- Cuando el backend responde 401, la ruta de Next borra la cookie `xd_session`, y la pantalla vuelve al login.
- Las rutas `/api/admin/*` de Next validan los datos con las mismas reglas que el backend antes de reenviarlos.

## 6. Diseño de la pantalla

Barra superior `bg-blue-900` (logo, "Panel de administración · ID", Cambiar mi contraseña, Cerrar sesión); contenido blanco con título "Médicos", botón "Registrar médico" (`#0b1533`), buscador, contador y tabla con bordes de 2 px y sin sombras. En pantallas angostas la tabla se convierte en tarjetas. Las ventanas usan `<dialog>` nativo (como "Nuevo paciente"), con foco en el primer campo con error.

## 7. Casos de prueba

### Automáticos (xUnit, `dotnet test`)

| ID | Caso | Archivo |
|---|---|---|
| PT72 | Médico en el apartado Administrador → apartado incorrecto, sin token | `AuthServiceTests` |
| PT73 | Administrador en el apartado Médico → apartado incorrecto, sin token | `AuthServiceTests` |
| PT74 | Administrador en su apartado → token con rol `A` | `AuthServiceTests` |
| PT75 | Cuenta desactivada con contraseña correcta → cuenta inactiva | `AuthServiceTests` |
| PT76 | Cuenta desactivada con contraseña incorrecta → solo "credenciales inválidas" | `AuthServiceTests` |
| PT77 | Cambiar mi contraseña con la actual correcta → nueva cifrada | `AuthServiceTests` |
| PT78 | Cambiar mi contraseña con la actual incorrecta → sin cambios | `AuthServiceTests` |
| PT79 | Perfil de administrador sin médico → "Administrador" | `DoctorServiceTests` |
| PT80 | Lista: solo médicos, ordenados por nombre | `DoctorAdministrationServiceTests` |
| PT81 | Búsqueda por nombre, ID y cédula | `DoctorAdministrationServiceTests` |
| PT82 | Editar con espacios de más → texto limpio | `DoctorAdministrationServiceTests` |
| PT83 | Editar con la cédula de otro médico → rechazado, sin cambios | `DoctorAdministrationServiceTests` |
| PT84 | Asignar contraseña → hash nuevo | `DoctorAdministrationServiceTests` |
| PT85 | Asignar contraseña a una cuenta de administrador → no la toca | `DoctorAdministrationServiceTests` |
| PT86 | Desactivar conserva los datos; se puede reactivar | `DoctorAdministrationServiceTests` |
| PT87 | Sesión de cuenta activa con su rol → vigente | `SessionValidatorTests` |
| PT88 | Sesión de cuenta desactivada después de entrar → deja de valer | `SessionValidatorTests` |

### Manuales (con la API y el frontend en marcha)

#### PT89. Apartados del login

- **Given** la cuenta 654321 / `admin` y una cuenta de médico.
- **When** cada una intenta entrar desde el apartado que no le corresponde, y luego desde el suyo.
- **Then** en el apartado equivocado aparece el mensaje que indica el apartado correcto; en el suyo, el médico llega a `/home` y el administrador a `/admin`.

#### PT90. Alta de un médico y primer inicio de sesión

- **Given** el administrador en `/admin`.
- **When** registra un médico nuevo y ese médico entra en el apartado Médico con el ID y la contraseña inicial.
- **Then** el médico aparece en la lista como "Activa" y entra a `/home` con su nombre en la barra superior.

#### PT91. Desactivar con sesión abierta

- **Given** un médico con `/home` abierto en otro navegador.
- **When** el administrador desactiva su cuenta y el médico realiza cualquier acción (o recarga).
- **Then** el médico vuelve al login, y al intentar entrar ve "Tu cuenta está desactivada…".

#### PT92. Rutas protegidas

- **Given** sin sesión, con sesión de médico y con sesión de administrador.
- **When** se escribe a mano `/admin`, `/home` y `/patients/PACIE00001/result`.
- **Then** sin sesión todo lleva a `/login`; el médico no puede abrir `/admin` (va a `/home`) y el administrador no puede abrir `/home` ni `/patients` (va a `/admin`).

#### PT93. Persistencia

- **Given** cambios hechos en el panel (alta, edición, contraseña, estado).
- **When** se reinician la API y el frontend y se vuelve a entrar.
- **Then** todos los cambios siguen ahí, y en SQL Server `MEDICOS` y `USUARIOS` muestran los mismos datos (la contraseña solo como hash `$2a$…`).

#### PT94. Cuenta internista de prueba

- **Given** la cuenta internista creada por `SeedInternistAccount.sql` (ID `654322`, contraseña inicial `admin`).
- **When** inicia sesión desde el apartado Médico y luego escribe a mano `/home`, una ruta de pacientes y `/admin`.
- **Then** entra con rol `I` y llega a `/internista`; `/home`, `/patients` y `/admin` lo regresan a `/internista` (P-140). El backend sigue aceptando al internista en los endpoints médicos.

### Verificación de extremo a extremo hecha por la IA (P-116)

Con la base real, una instancia aparte del backend y del frontend: 37 comprobaciones de la API y 25 de las rutas de Next y `proxy.ts`, todas correctas (incluye PT89 a PT92 por HTTP), y el login real en Edge sin ventana. Los médicos de prueba (990001, 990002) se borraron al terminar.
