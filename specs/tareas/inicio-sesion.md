# Tareas: inicio de sesión

Especificación: [ESP-001](../especificaciones/03-inicio-sesion.md) · Plan: [02-plan-inicio-sesion.md](../planes/02-plan-inicio-sesion.md)

Cada tarea indica el requisito o la decisión que cumple, la prueba que la verifica y si la hizo una persona o un asistente de IA. La columna **Revisión humana** remite a [auditoria-humana.md](../auditoria/auditoria-humana.md). Una tarea hecha con IA solo cuenta como terminada cuando una persona del equipo la revisó.

Leyenda: `[x]` implementada · `[ ]` pendiente.

## Backend

| # | Tarea | Cumple | Prueba | Hecha por | Revisión humana |
|---|---|---|---|---|---|
| [x] T01 | Endpoint `POST /api/auth/login` con BCrypt y JWT (versión inicial). | RF-01, RF-03, RF-04 | PT01, PT02 | Equipo | — |
| [x] T02 | Migración de contraseñas en texto plano a BCrypt y script `UpgradeUserPasswordColumn.sql`. | RF-05 | PT06 | Equipo | — |
| [x] T03 | Interfaces `IUserRepository`, `IPasswordCredentialVerifier`, `ITokenService` e `IDatabaseHealthService`. | D-01, D-02 | `AuthServiceTests` | IA (P-04) | Pendiente |
| [x] T04 | `UserRepository` sobre EF Core. | D-02 | PT01 | IA (P-04) | Pendiente |
| [x] T05 | `AuthService` como fachada, con precondiciones verificadas. | D-01, D-04 | `AuthServiceTests` | IA (P-04) | A-04 (corregido) |
| [x] T06 | `PasswordCredentialVerifier` sin efectos ocultos y con verificación ficticia. | D-03, D-04 | `PasswordCredentialVerifierTests` | IA (P-04) | Pendiente |
| [x] T07 | `JwtOptions` validadas al arrancar; emisor, audiencia y expiración en la configuración. | D-05, RNF-03 | PT08, `JwtTokenServiceTests` | IA (P-04) | Pendiente |
| [x] T08 | Validación del modelo con respuesta 400 `{ error }`. | RF-02 | PT04, PT05 | IA (P-04) | Pendiente |
| [x] T09 | `GlobalExceptionHandler` (503 / 500). | D-06, CA-05 | PT07 | IA (P-04) | Pendiente |
| [x] T10 | Validación de JWT (`AddJwtBearer`) y CORS desde la configuración. | RNF-03 | — | IA (P-04) | Pendiente |
| [x] T11 | Agregar el proyecto de pruebas a la solución y marcar `PT02` como prueba de integración. | R-PRU-02 | `dotnet test` | IA (P-04) | Pendiente |

## Frontend

| # | Tarea | Cumple | Prueba | Hecha por | Revisión humana |
|---|---|---|---|---|---|
| [x] T12 | Pantalla de inicio de sesión con selector de cuenta y animación (versión inicial). | RF-06 | PT14 | Equipo | — |
| [x] T13 | Modelo `types/auth.ts` y validación `lib/loginValidation.ts`. | RF-07 | PT09, PT10 | IA (P-04) | Pendiente |
| [x] T14 | Patrón Estado en `lib/loginState.ts`. | RF-08, D-08 | PT11, PT16 | IA (P-04) | Pendiente |
| [x] T15 | Extraer `LoginForm.tsx` conservando el diseño; agregar etiquetas y atributos ARIA. | D-10, RNF-05 | PT14 | IA (P-04) | Pendiente |
| [x] T16 | `services/authService.ts` y `lib/apiClient.ts`. | ARQ | PT12, PT15 | IA (P-04) | Pendiente |
| [x] T17 | Ruta `/api/login` con validación y cookie `httpOnly`; "Recuérdame" funcional. | RNF-01, RF-09, D-07 | PT13 | IA (P-04) | Pendiente |
| [x] T18 | Singleton de la conexión a SQL Server en el backend (`Data/DatabaseConnection.cs`), inicializado en `Program.cs`. La conexión a la base de datos está solo en el backend. | D-09 | `DatabaseConnectionTests` | IA | Pendiente |
| [x] T19 | Corregir las advertencias de ESLint `set-state-in-effect` en `page.tsx` y `LoginForm.tsx`. | Calidad | `npm run lint` | IA (P-04) | Pendiente |

## Documentación y proceso

| # | Tarea | Cumple | Prueba | Hecha por | Revisión humana |
|---|---|---|---|---|---|
| [x] T20 | Casos Given-When-Then PT01–PT16. | R-PRU-01 | — | IA (P-04) | A-03 (corregido) |
| [x] T21 | Documento de arquitectura, SOLID y patrones. | R-ARQ-06 | — | IA (P-04) | Pendiente |
| [x] T22 | Carpeta `specs/` con reglas, especificación, plan, tareas, bitácora y auditoría. | R-IA-01, R-IA-02 | — | IA (P-07) | Pendiente |
| [ ] T23 | Ejecutar manualmente PT01–PT16 y registrar los resultados. | R-PRU-01 | PT01–PT16 | Equipo | — |
| [ ] T24 | Revisar y firmar en la auditoría las tareas T03–T22. | R-IA-02 | — | Equipo | — |

## Pendientes del inicio de sesión

| # | Tarea | Motivo |
|---|---|---|
| [ ] T25 | Definir el destino de "Términos y privacidad" y de "Recuperar contraseña", y convertirlos en controles accesibles con teclado. | Hoy son `<span>` sin acción (R-UI-03). |
| [x] T27 | Hacer el primer commit y crear las ramas `main` y `Develop`. | Hecho: el repositorio en GitHub tiene `main`, `Develop` y ramas por función. |
| [x] T28 | Transición tras el login: capa con desenfoque y animación loading-dots, y redirección a la pantalla del rol. `/home` quedó protegida con `proxy.ts` (T65). | IA (P-08, P-143), revisión pendiente. |

Las tareas de los demás módulos están en su propio archivo: ver el [índice de tareas](README.md).
