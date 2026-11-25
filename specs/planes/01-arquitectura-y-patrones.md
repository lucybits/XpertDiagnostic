# 05. Arquitectura, SOLID y patrones de diseño

Este documento explica cómo está organizado el código del inicio de sesión. Cubre:

- la arquitectura por capas;
- dónde se aplican los principios SOLID y los contratos;
- los tres patrones de diseño GoF implementados;
- cómo se cumplen los requisitos de seguridad y de usabilidad.

## 1. Arquitectura multicapa (MVC)

### Backend (ASP.NET Core): `backend/XpertDiagnostic.Api`

| Capa | Carpeta | Responsabilidad |
|---|---|---|
| **Controlador** | `Controllers/` | Recibe la solicitud HTTP, delega en un servicio y traduce el resultado a una respuesta HTTP. No contiene lógica de negocio. |
| **Servicios** | `Services/` y `Services/Interfaces/` | Lógica de negocio: autenticación, verificación de contraseñas y emisión de tokens. |
| **Repositorios** | `Repositories/` | Acceso a datos. Aísla a los servicios de Entity Framework. |
| **Datos** | `Data/` | `AppDbContext` de Entity Framework Core. |
| **Modelo** | `Models/Entities/`, `Models/DTOs/`, `Models/Results/` | Entidades de la base de datos, objetos de entrada y salida de la API y resultados internos. |
| **Configuración** | `Configuration/` | Opciones tipadas y validadas al arrancar (`JwtOptions`). |
| **Middleware** | `Middleware/` | Manejo centralizado de errores (`GlobalExceptionHandler`). |

En el backend la **Vista** es la representación JSON que devuelven los controladores. La vista de usuario está en el frontend.

Flujo de una solicitud de inicio de sesión:

```text
AuthController ──► IAuthService (AuthService) ──► IUserRepository (UserRepository) ──► AppDbContext ──► SQL Server
                                               ├─► IPasswordCredentialVerifier (PasswordCredentialVerifier)
                                               └─► ITokenService (JwtTokenService)
```

### Frontend (Next.js): `frontend`

| Capa | Carpeta | Responsabilidad |
|---|---|---|
| **Vista** | `app/(auth)/login/page.tsx`, `components/auth/LoginForm.tsx`, `components/ui/` | Presentación y eventos del usuario. |
| **Controlador** | `services/authService.ts`, `app/api/login/route.ts` | Comunica la vista con el backend. Traduce códigos HTTP a resultados del dominio y guarda el token en una cookie segura. |
| **Modelo** | `types/auth.ts`, `lib/loginState.ts`, `lib/loginValidation.ts` | Tipos del dominio, estados del formulario y reglas de validación. |
| **Infraestructura** | `lib/apiClient.ts`, `lib/db.ts` | Cliente HTTP y conexión a SQL Server. |

**Pacientes y catálogos (P-102).** Siguen el mismo esquema por capas que médicos:

- Vista: `NewPatientDialog.tsx` y `PatientSearchDialog.tsx`.
- Controlador: `services/patientService.ts`, `services/catalogService.ts`, `app/api/patients/route.ts` y `app/api/catalogs/[name]/route.ts`.
- Modelo: `types/patient.ts`, `types/catalog.ts` y `lib/newPatient.ts`.
- Backend: `PatientsController` → `IPatientService` → `IPatientRepository`, y `CatalogsController` → `ICatalogService` → `ICatalogRepository`.

**Interfaz de salida (P-105).** Sigue el mismo esquema por capas:

- Vista: `app/(app)/patients/[id]/result/page.tsx`, `components/result/PatientResultScreen.tsx` y `ResultSections.tsx`.
- Controlador: `services/resultService.ts` y las rutas `app/api/patients/[id]/{result,diagnosis,treatment,plan}`.
- Modelo: `types/result.ts`.
- Backend: `PatientResultController` → `IPatientResultService` → `IPatientResultRepository`.

**Captura del expediente.** El centro de la pantalla del tratante sigue la misma separación por capas:

| Capa | Archivos | Responsabilidad |
|---|---|---|
| **Vista** | `components/capture/`: `SectionWorkspace.tsx` (contenedor), `SectionHeader.tsx`, `SectionCapture.tsx`, `DiagnosisPanel.tsx`, `SessionPatientPill.tsx`, `styles.ts` | El contenedor elige qué mostrar: la captura de la sección, el diagnóstico diferencial o, sin paciente, el aviso para buscarlo. |
| **Modelo** | `types/record.ts`, `types/validation.ts` | Expediente, análisis y validación del internista. |
| **Controlador** | `services/recordService.ts`, `services/validationService.ts` | Llaman a las rutas de `app/api/patients/` y `app/api/validations/`. |

## 2. Principios SOLID

| Principio | Dónde se aplica |
|---|---|
| **S**: responsabilidad única | Cada clase tiene una sola razón para cambiar: `AuthController` maneja HTTP, `AuthService` coordina la autenticación, `UserRepository` accede a los datos, `PasswordCredentialVerifier` compara contraseñas, `JwtTokenService` emite tokens y `GlobalExceptionHandler` convierte errores en respuestas. En el frontend, `LoginForm` presenta, `authService` se comunica con el servidor, `loginValidation` valida y `loginState` define los estados. |
| **O**: abierto/cerrado | Para cambiar el algoritmo de hash o el tipo de token se crea otra implementación de `IPasswordCredentialVerifier` o `ITokenService` y se registra en `Program.cs`, sin modificar `AuthService`. Para agregar un estado al formulario se agrega una clase en `loginState.ts`, sin tocar los demás estados. |
| **L**: sustitución de Liskov | Cualquier implementación de `IUserRepository` puede reemplazar a otra. Las pruebas usan `RepositorioFalso` en memoria en lugar de SQL Server y `AuthService` funciona igual. |
| **I**: segregación de interfaces | Las interfaces son pequeñas y específicas (`ITokenService`, `IPasswordCredentialVerifier`, `IDatabaseHealthService`) en lugar de una sola interfaz grande de seguridad. |
| **D**: inversión de dependencias | Controladores y servicios dependen de interfaces, no de clases concretas. El contenedor de inyección de dependencias de `Program.cs` decide qué implementación usar. Por ejemplo, `DiagnosisService` depende de `IInferenceEngine`; hoy se registra `ProvisionalInferenceEngine`, y la máquina de inferencia del equipo se conectará registrando su clase, sin cambiar el servicio, el controlador ni el frontend. |

## 3. Contratos: precondiciones, postcondiciones e invariantes

Los métodos clave documentan su contrato con `@pre`, `@post` e `@inv`. Las precondiciones del backend también se verifican en tiempo de ejecución con `ArgumentException` y `ArgumentOutOfRangeException`, y algunas postcondiciones con `Debug.Assert`.

| Elemento | Archivo | Contrato |
|---|---|---|
| `IAuthService.LoginAsync` | `Services/Interfaces/IAuthService.cs` | `@pre` ID > 0 y contraseña de 1 a 72 caracteres. `@post` devuelve un token válido o null sin modificar datos. |
| `AuthService` | `Services/AuthService.cs` | `@inv` dependencias no nulas. Verifica las `@pre` al inicio del método. |
| `IUserRepository` | `Repositories/IUserRepository.cs` | `@pre` y `@post` de cada consulta y actualización. |
| `IPasswordCredentialVerifier.Verificar` | `Services/Interfaces/IPasswordCredentialVerifier.cs` | `@post` según el tipo de valor guardado (BCrypt, texto plano o inexistente). |
| `ITokenService.GenerarToken` | `Services/Interfaces/ITokenService.cs` | `@pre` usuario con ID y rol. `@post` token no vacío con expiración futura. |
| `AuthController.Login` | `Controllers/AuthController.cs` | `@post` 200 / 401 según el resultado. |
| `User`, `LoginRequest`, `JwtOptions` | `Models/`, `Configuration/` | `@inv` del modelo. `JwtOptions` se valida al arrancar. |
| `LoginState` | `frontend/lib/loginState.ts` | `@inv` del estado y `@pre`/`@post` de cada transición. |
| `getConnection` | `frontend/lib/db.ts` | `@inv` un solo pool por proceso. |
| `validateLoginInput`, `login`, `postJson` | `frontend/lib/`, `frontend/services/` | `@pre` y `@post` de validación y comunicación. |

## 4. Patrones de diseño GoF

### 4.1 Singleton (creacional): conexión a SQL Server

**Archivo:** `frontend/lib/db.ts`

**Problema que resuelve.** Crear una conexión nueva a SQL Server cada vez que se necesita generaría conexiones repetidas y desperdiciaría recursos del servidor de base de datos.

**Implementación.** `getConnection()` es el único punto de acceso al pool de conexiones:

- La primera llamada crea el pool y lo guarda.
- Las siguientes llamadas devuelven el mismo pool.

Además, la implementación cuida tres casos:

- **Solicitudes simultáneas:** se guarda la *promesa* de conexión y no el pool ya conectado. Así, si llegan varias solicitudes mientras se abre la primera conexión, todas comparten esa misma conexión en lugar de abrir una cada una.
- **Recarga en desarrollo:** la instancia se guarda en `globalThis`, para que la recarga de módulos de Next.js no cree pools nuevos.
- **Fallas:** si la conexión falla o el pool emite un error, la instancia se descarta y la siguiente llamada vuelve a intentar.

### 4.2 Fachada (estructural): proceso de autenticación

**Archivos:** `backend/XpertDiagnostic.Api/Services/Interfaces/IAuthService.cs` y `Services/AuthService.cs`

**Problema que resuelve.** Autenticar requiere varios pasos:

1. buscar al usuario;
2. verificar su contraseña;
3. migrar contraseñas heredadas a BCrypt;
4. generar el token.

Si el controlador hiciera todo directamente, acumularía lógica y conocería los detalles de cada subsistema.

**Implementación.** `AuthController` recibe la solicitud y llama a un solo método de la fachada: `IAuthService.LoginAsync`. `AuthService` coordina los subsistemas, cada uno detrás de su interfaz:

- `IUserRepository`: datos;
- `IPasswordCredentialVerifier`: contraseñas;
- `ITokenService`: tokens.

El controlador no sabe que existen BCrypt, Entity Framework ni JWT.

### 4.3 Estado (de comportamiento): formulario de inicio de sesión

**Archivos:** `frontend/lib/loginState.ts` (estados) y `frontend/components/auth/LoginForm.tsx` (contexto)

**Problema que resuelve.** Durante el inicio de sesión, la interfaz pasa por distintos momentos: captura de datos, espera de respuesta y presentación del resultado. Cada momento debe mostrar algo distinto (carga, mensajes, campos marcados) y reaccionar de forma distinta a las acciones del usuario. Si se controlara con varias variables booleanas sueltas, podrían quedar combinaciones inválidas, como "cargando" y "error" a la vez, o un segundo envío mientras se espera la respuesta.

**Implementación.** La interfaz `LoginState` tiene cuatro clases concretas: `IdleState`, `SubmittingState`, `SuccessState` y `ErrorState`. Cada una:

- decide qué se muestra (`isLoading`, `errorMessage`, `successMessage`, `invalidFields`);
- decide cómo responde a cada evento (`submit`, `fail`, `succeed`, `edit`).

`LoginForm` es el **contexto**: guarda el estado actual con `useState` y le delega los eventos. Cuando el estado cambia, React actualiza la interfaz.

Algunas transiciones no tienen sentido en ciertos estados y devuelven el mismo estado. Por ejemplo, `SubmittingState.submit()` no hace nada, y eso evita el doble envío.

### Alcance

Fachada y Estado se aplican en el flujo de inicio de sesión, y Singleton en la conexión a SQL Server. Es más preciso describirlos como patrones aplicados en esas partes del proyecto que en todos sus módulos.

## 5. Seguridad del inicio de sesión

- **Validación en el servidor:** `LoginRequest` define las reglas con DataAnnotations. Si no se cumplen, `[ApiController]` responde **400** antes de ejecutar el controlador. La ruta `/api/login` de Next.js también valida el cuerpo antes de reenviarlo.
- **Verificación de credenciales con hash:** las contraseñas se comparan con **BCrypt**. Las contraseñas heredadas en texto plano se migran a BCrypt en el primer inicio de sesión correcto. Si el usuario no existe, se hace una verificación ficticia del mismo costo, para que el tiempo de respuesta no revele qué IDs existen.
- **Respuestas HTTP apropiadas:**
  - 200: correcto;
  - 400: datos inválidos;
  - 401: credenciales incorrectas, con el mismo mensaje si el usuario existe o no;
  - 503: base de datos no disponible;
  - 500: error inesperado.

  `GlobalExceptionHandler` registra el detalle del error en el log y nunca lo envía al cliente.
- **Configuración fuera del código:**
  - La cadena de conexión y `Jwt:Key` se leen de `dotnet user-secrets` en desarrollo, o de variables de entorno (`ConnectionStrings__DefaultConnection`, `Jwt__Key`) en otros entornos.
  - La API valida al arrancar que existan y que la clave tenga al menos 32 caracteres.
  - El frontend lee sus datos de `.env.local`, que no se sube al repositorio.
- **Token protegido:** el JWT se guarda en una cookie `httpOnly` y `SameSite=Strict`, con `Secure` en producción. JavaScript del navegador no puede leerla y el token no aparece en la respuesta JSON.

## 6. Usabilidad y accesibilidad de la interfaz

| Requisito | Implementación |
|---|---|
| Etiquetas | Cada campo tiene un `<label>` asociado. Es visualmente oculto (`sr-only`) para conservar el diseño, pero los lectores de pantalla lo leen. |
| Mensajes de error | Alerta con `role="alert"`, campos con `aria-invalid`, y `aria-describedby` apuntando al mensaje. |
| Estado de carga | Botón deshabilitado con animación (`role="status"`), formulario con `aria-busy` y selector de cuenta deshabilitado mientras se espera. |
| Teclado | Todos los controles son elementos nativos (`input`, `button`, `label`) y muestran el foco con `focus-visible`. El formulario se envía con Enter. |
| ARIA | `aria-label` y `aria-pressed` en "Mostrar contraseña", `aria-controls`, `aria-hidden` en iconos decorativos, `inert` mientras la tarjeta está oculta. |
| Texto alternativo | La ilustración informativa tiene `alt="Ilustración de personal médico"`. El logo es decorativo y lleva `alt=""` porque el nombre ya está en el encabezado. |
| **Consistencia** | Mismos colores, tipografía y mensajes en todos los estados. El backend y el frontend usan el mismo formato de error, `{ error }`. |
| **Retroalimentación** | Cada estado del patrón Estado tiene una respuesta visible: carga, error en rojo y éxito en verde. Los mensajes indican qué corregir. |
| **Prevención** | El ID solo acepta dígitos y tiene un máximo de 10. La contraseña tiene un máximo de 72 caracteres. Hay validación previa al envío y el doble envío está bloqueado. |
