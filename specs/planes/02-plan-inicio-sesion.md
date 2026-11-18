# 02. Plan técnico: inicio de sesión

| Campo | Valor |
|---|---|
| Especificación | [ESP-001](../especificaciones/03-inicio-sesion.md) |
| Tareas | [tareas/inicio-sesion.md](../tareas/inicio-sesion.md) |
| Arquitectura general | [01-arquitectura-y-patrones.md](01-arquitectura-y-patrones.md) |

## 1. Contexto técnico

| Componente | Tecnología |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript 5, Tailwind CSS 4 |
| Backend | ASP.NET Core 8 (C#), Entity Framework Core 8 |
| Base de datos | SQL Server, tabla existente `dbo.USUARIOS` |
| Hash de contraseñas | BCrypt.Net-Next 4.2.0 |
| Token | JWT HMAC-SHA256 (Microsoft.IdentityModel) |
| Pruebas | xUnit 2.5 |

## 2. Flujo

```text
LoginForm (vista)
  │  validateLoginInput()           ← prevención en el cliente (RF-07)
  │  LoginState: Idle → Submitting  ← patrón Estado (RF-08)
  ▼
services/authService.login()
  ▼
app/api/login/route.ts (Next.js, servidor)
  │  valida el cuerpo, reenvía al backend y guarda el token en una cookie httpOnly (RNF-01, RF-09)
  ▼
AuthController (ASP.NET Core)
  │  [ApiController] + DataAnnotations → 400 si los datos son inválidos (RF-02)
  ▼
IAuthService → AuthService          ← patrón Fachada
  ├─ IUserRepository.ObtenerPorIdAsync
  ├─ IPasswordCredentialVerifier.Verificar      (RF-03, RF-05)
  ├─ IUserRepository.ActualizarPasswordHashAsync (solo si hay hash nuevo)
  └─ ITokenService.GenerarToken                 (RF-04)
```

Los errores de base de datos los convierte `GlobalExceptionHandler` en respuestas 503 (CA-05).

## 3. Decisiones

| ID | Decisión | Alternativa descartada | Motivo |
|---|---|---|---|
| D-01 | Fachada `IAuthService` sobre repositorio, verificador y emisor de tokens. | Toda la lógica en `AuthController`. | Responsabilidad única y pruebas sin base de datos. |
| D-02 | Repositorio `IUserRepository` sobre EF Core. | Servicios que usan `AppDbContext` directamente. | Inversión de dependencias: las pruebas usan un repositorio en memoria. |
| D-03 | El verificador devuelve un resultado (`PasswordVerificationResult`) en lugar de modificar la entidad. | Método estático que modifica `User`. | Sin efectos ocultos; quien guarda los cambios es el repositorio. |
| D-04 | Verificación BCrypt ficticia cuando el ID no existe. | Responder de inmediato. | Evita revelar qué IDs existen por el tiempo de respuesta (RNF-02). |
| D-05 | Secretos en `dotnet user-secrets` o variables de entorno, validados al arrancar (`JwtOptions` + `ValidateOnStart`). | Secretos en `appsettings.json`. | R-SEG-01. Además, un error de configuración se detecta al iniciar la API y no en el primer inicio de sesión. |
| D-06 | `GlobalExceptionHandler` centraliza los errores. | `try/catch` en cada controlador. | Controladores más simples y sin dependencia de `SqlClient`. |
| D-07 | Token en una cookie `httpOnly` + `SameSite=Strict` establecida por la ruta de Next.js. | Devolver el token al navegador para guardarlo en `localStorage`. | Un script malicioso (XSS) no puede robar el token (RNF-01). |
| D-08 | Patrón Estado con clases inmutables (`lib/loginState.ts`). | Varias banderas `useState` (`isLoading`, `error`, `success`). | Impide combinaciones inválidas y el doble envío (RF-08). |
| D-09 | Singleton del pool de SQL Server en `lib/db.ts`, guardando la promesa en `globalThis`. | Una conexión nueva por solicitud. | Reutilizar conexiones, también entre recargas de desarrollo. |
| D-10 | Extraer el formulario a `components/auth/LoginForm.tsx` conservando sus clases CSS. | Mantener todo en `page.tsx`. | Separar la vista de la página y la del formulario sin cambiar el diseño (R-UI-06). |

## 4. Archivos

| Capa | Archivos |
|---|---|
| Controlador | `Controllers/AuthController.cs`, `Controllers/HealthController.cs` |
| Servicios | `Services/AuthService.cs`, `Services/PasswordCredentialVerifier.cs`, `Services/JwtTokenService.cs`, `Services/DatabaseHealthService.cs`, `Services/Interfaces/*` |
| Repositorio | `Repositories/IUserRepository.cs`, `Repositories/UserRepository.cs` |
| Modelo | `Models/Entities/User.cs`, `Models/DTOs/*`, `Models/Results/*` |
| Configuración | `Configuration/JwtOptions.cs`, `Program.cs`, `appsettings*.json` |
| Errores | `Middleware/GlobalExceptionHandler.cs` |
| Vista | `frontend/app/(auth)/login/page.tsx`, `frontend/components/auth/LoginForm.tsx` |
| Controlador cliente | `frontend/services/authService.ts`, `frontend/app/api/login/route.ts` |
| Modelo cliente | `frontend/types/auth.ts`, `frontend/lib/loginState.ts`, `frontend/lib/loginValidation.ts` |
| Infraestructura cliente | `frontend/lib/apiClient.ts`, `frontend/lib/db.ts` |
| Pruebas | `XpertDiagnostic.Tests/AuthServiceTests.cs`, `PasswordCredentialVerifierTests.cs`, `JwtTokenServiceTests.cs`, `UnitTest1.cs` |

## 5. Riesgos

| Riesgo | Mitigación |
|---|---|
| Contraseñas heredadas en texto plano en `USUARIOS.PASS`. | Migración automática a BCrypt (RF-05) y script `Sql/UpgradeUserPasswordColumn.sql`. |
| Un integrante del equipo no tiene configurados los secretos. | La API se detiene con un mensaje claro y la guía de instalación explica cómo configurarlos. |
| `/api/test-db` expone la base de datos desde el frontend. | Solo responde en desarrollo y no devuelve detalles del error. |
