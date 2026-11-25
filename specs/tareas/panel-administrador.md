# Tareas: panel de administración y roles

Especificación: [ESP-007](../especificaciones/10-panel-administrador.md)

Cada tarea indica el requisito o la decisión que cumple, la prueba que la verifica y si la hizo una persona o un asistente de IA. La columna **Revisión humana** remite a [auditoria-humana.md](../auditoria/auditoria-humana.md). Una tarea hecha con IA solo cuenta como terminada cuando una persona del equipo la revisó.

Leyenda: `[x]` implementada · `[ ]` pendiente.

> T60 a T66 estaban citadas en ESP-007 pero nunca se escribieron. Se reconstruyeron el 2026-11-25 a partir de la especificación y del código; su prompt (P-116) no quedó en la bitácora.

| # | Tarea | Cumple | Prueba | Hecha por | Revisión humana |
|---|---|---|---|---|---|
| [x] T60 | Cambios en `USUARIOS` sin perder registros: `IdMEDICO` opcional para administradores, `Activo`, `FechaRegistro` y restricciones de rol; cuenta de administrador de prueba (`SeedAdminAccount.sql`). | HU-20, HU-23 | PT93 | IA (P-116) | Pendiente |
| [x] T61 | Login por apartado: el apartado Médico solo acepta médicos y el de Administrador solo administradores; una cuenta desactivada no entra. Desde P-157 el mensaje no dice de qué tipo es la cuenta. | RF-50, RF-51 | PT72 a PT76, PT89 | IA (P-116, P-157) | Pendiente |
| [x] T62 | `SessionValidator`: en cada petición la cuenta del token debe existir, estar activa y conservar su rol; si no, 401 y la sesión se cierra. | HU-25 | PT87, PT88, PT91 | IA (P-116) | Pendiente |
| [x] T63 | API `api/admin/doctors`: listar, buscar, registrar, editar, asignar contraseña, activar y desactivar médicos, sin tocar cuentas de administrador ni devolver hashes. | RF-53 a RF-57, RF-59 | PT80 a PT86, PT90 | IA (P-116) | Pendiente |
| [x] T64 | El administrador cambia su propia contraseña escribiendo la actual. | RF-58 | PT77, PT78 | IA (P-116) | Pendiente |
| [x] T65 | `proxy.ts`: sin sesión a `/login`; cada rol solo en sus pantallas (`/home` y `/patients` tratante, `/internista` internista, `/admin` administrador). | RF-52 | PT92, PT94 | IA (P-116, P-143) | Pendiente |
| [x] T66 | Pantalla `/admin`: tabla de médicos con buscador, ventanas `<dialog>` para registrar, editar, contraseña y estado; tarjetas en pantallas angostas. | HU-20 a HU-23, HU-26 | PT89, PT90 | IA (P-116) | Pendiente |
| [ ] T67 | Ejecutar a mano PT89 a PT94 con la API y el frontend en marcha. | R-PRU-01 | PT89 a PT94 | Equipo | — |
| [x] T68 | Tres roles (`T` tratante, `I` internista, `A` administrador), cuenta internista de prueba (`SeedInternistAccount.sql`) y pantalla de inicio según el rol. | Estructura final de roles | PT94 | Equipo (commits 2d16977, 4aa77ae; P-140, P-143) | — |
| [x] T70 | El administrador registra y elimina médicos (tratantes o internistas) y pacientes desde el panel. | Estructura final de roles | `DoctorServiceTests`, `PatientServiceTests` | Equipo (commit 04a348c) | — |
| [x] T71 | Acciones de cada fila como íconos circulares de color con etiqueta al pasar el cursor (`IconAction`). | Decisión de Lucía | `tsc`, `eslint` | IA (P-156) | Pendiente |
