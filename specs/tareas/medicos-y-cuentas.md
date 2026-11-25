# Tareas: médicos y cuentas de usuario

Especificación: [ESP-002](../especificaciones/05-registro-medicos.md)

Cada tarea indica el requisito o la decisión que cumple, la prueba que la verifica y si la hizo una persona o un asistente de IA. La columna **Revisión humana** remite a [auditoria-humana.md](../auditoria/auditoria-humana.md). Una tarea hecha con IA solo cuenta como terminada cuando una persona del equipo la revisó.

Leyenda: `[x]` implementada · `[ ]` pendiente.

| # | Tarea | Cumple | Prueba | Hecha por | Revisión humana |
|---|---|---|---|---|---|
| [x] T35 | Tabla `MEDICOS` sencilla (`CreateDoctorsAndUsersTables.sql`) enlazada a `USUARIOS`; el médico 1 se pasó desde el respaldo y el 123456 (ficticio) se registró con cédula 0000000 (P-39); llave foránea agregada. | ESP-002 | PT17 a PT22 | IA (P-38) | Pendiente |
| [x] T36 | API: `GET /api/doctors/me` y `POST /api/doctors` (solo rol `A`) con `DoctorService`, `DoctorRepository` e `IPasswordHasher`. | ESP-002 | PT17 a PT22 | IA (P-38) | Pendiente |
| [x] T37 | Frontend: rutas `/api/session` y `/api/doctors`, barra superior con el nombre real y opción "Registrar médico" solo para administradores. | ESP-002 | PT23 a PT28 | IA (P-38) | Pendiente |
| [x] T38 | Pantalla `/doctors/new` para registrar médicos con su cuenta. Reemplazada por el panel de administración (ESP-007). | ESP-002 | PT23 a PT28 | IA (P-38) | Pendiente |
| [ ] T39 | Ejecutar a mano PT23 a PT28 con la API y el frontend en marcha. | R-PRU-01 | PT23 a PT28 | Equipo | — |
