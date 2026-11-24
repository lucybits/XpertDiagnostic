# Guía de instalación y colaboración

Esta guía explica cómo descargar el repositorio, preparar las herramientas y arrancar los componentes disponibles en Windows. Está escrita para la estructura actual del repositorio.

> Estado actual: el inicio de sesión funciona de extremo a extremo (frontend → API → SQL Server). Para eso, la API necesita una base de datos `XpertDiagnostic` existente con la tabla `USUARIOS`, y la configuración secreta descrita en la sección 5. El resto de los casos de uso y el servicio de IA todavía no están implementados.

## 1. Requisitos de equipo y programas

Se recomienda Windows 10 u 11 de 64 bits, conexión a Internet durante la instalación de dependencias y permisos para instalar herramientas.

Instala lo siguiente desde sus sitios oficiales:

- [**Git for Windows**](https://git-scm.com/download/win), para clonar el repositorio y trabajar con ramas. No se necesita para descargar y ejecutar solamente una copia ZIP.
- [**Node.js 22 LTS o posterior compatible**](https://nodejs.org/en/download) y npm, para el frontend. Next.js en este proyecto requiere Node.js 20.9.0 como mínimo; se recomienda una versión LTS vigente que cumpla ese mínimo. npm se instala junto con Node.js.
- [**.NET 8 SDK**](https://dotnet.microsoft.com/download/dotnet/8.0), no solo el runtime, para restaurar, compilar y ejecutar el backend ASP.NET Core.
- [**Python 3.12**](https://www.python.org/downloads/), para preparar el entorno previsto para el servicio de IA cuando ese componente tenga una aplicación implementada.
- [**SQL Server Developer o Express**](https://www.microsoft.com/sql-server/sql-server-downloads) y, opcionalmente, [**SQL Server Management Studio (SSMS)**](https://learn.microsoft.com/sql/ssms/download-sql-server-management-studio-ssms), para la base de datos `XpertDiagnostic` que usa la API.
- **Visual Studio Code** es opcional y puede usarse para editar los archivos y abrir terminales.

Comprueba las instalaciones desde PowerShell:

```powershell
git --version
node --version
npm --version
dotnet --list-sdks
py --list
```

La solución apunta a .NET 8. Para el frontend, el requisito mínimo de Node.js declarado por Next.js es 20.9.0. La versión exacta de Python no está fijada en un manifiesto de proyecto; Python 3.12 es la versión de desarrollo usada como referencia para esta guía.

## 2. Descargar el proyecto

### Opción A: descargar como ZIP

1. Abre el repositorio de XpertDiagnostic en GitHub.
2. En el selector de ramas, selecciona `Develop` si deseas descargar el estado de esa rama.
3. Abre el menú **Code** y selecciona **Download ZIP**.
4. Extrae el ZIP en una carpeta de trabajo, por ejemplo `C:\Proyectos\XpertDiagnostic`.
5. Abre esa carpeta extraída en el Explorador de archivos y escribe `powershell` en la barra de dirección para abrir una terminal en la raíz del proyecto.

Un ZIP no contiene la carpeta interna `.git`. Sirve para consultar y ejecutar una copia, pero no permite crear ramas, confirmar cambios ni hacer push. Para colaborar, sigue la opción B.

### Opción B: clonar para contribuir

Abre PowerShell en el directorio donde quieras guardar el repositorio y ejecuta:

```powershell
git clone --branch Develop https://github.com/lucybits/XpertDiagnostic.git
Set-Location XpertDiagnostic
```

Confirma que la copia quedó en la rama base prevista:

```powershell
git status --short --branch
git branch --show-current
```

Debe aparecer `Develop` como rama actual y un árbol de trabajo limpio.

## 3. Estructura actual del repositorio

El árbol siguiente incluye los archivos versionados del proyecto. Las carpetas generadas al instalar dependencias o compilar —por ejemplo, `node_modules`, `.next`, `bin`, `obj` y `.venv`— no forman parte de la estructura fuente.

```text
XpertDiagnostic/
├── .gitignore
├── ai-service/
│   ├── requirements.txt
│   └── app/
│       ├── __init__.py
│       ├── main.py
│       ├── routers/
│       │   └── __init__.py
│       ├── schemas/
│       │   └── __init__.py
│       └── services/
│           └── __init__.py
├── backend/
│   ├── XpertDiagnostic.sln
│   ├── XpertDiagnostic.Api/
│   │   ├── XpertDiagnostic.Api.csproj
│   │   ├── XpertDiagnostic.Api.http
│   │   ├── Program.cs
│   │   ├── appsettings.json
│   │   ├── appsettings.Development.json
│   │   ├── Configuration/        (opciones tipadas: JwtOptions)
│   │   ├── Controllers/          (AuthController, HealthController)
│   │   ├── Data/                 (AppDbContext)
│   │   ├── Middleware/           (GlobalExceptionHandler)
│   │   ├── Models/
│   │   │   ├── DTOs/             (LoginRequest, LoginResponse, ErrorResponse)
│   │   │   ├── Entities/         (Usuario)
│   │   │   └── Results/          (GeneratedToken, PasswordVerificationResult, DatabaseStatus)
│   │   ├── Properties/
│   │   │   └── launchSettings.json
│   │   ├── Repositories/         (IUserRepository, UserRepository)
│   │   ├── Services/             (AuthService, JwtTokenService, PasswordCredentialVerifier, DatabaseHealthService)
│   │   │   └── Interfaces/       (IAuthService, ITokenService, IPasswordCredentialVerifier, IDatabaseHealthService)
│   │   └── Sql/
│   │       └── UpgradeUserPasswordColumn.sql
│   └── XpertDiagnostic.Tests/    (pruebas xUnit)
├── specs/                    (desarrollo guiado por especificaciones, SDD)
│   ├── README.md
│   ├── reglas/               (constitución del proyecto)
│   ├── especificaciones/     (introducción, requisitos, inicio de sesión, pruebas TDD)
│   ├── planes/               (arquitectura y plan técnico)
│   ├── tareas/               (tareas por funcionalidad)
│   ├── guias/                (esta guía)
│   ├── bitacora/             (bitácora de prompts)
│   └── auditoria/            (auditoría y corrección humana)
└── frontend/
    ├── .env.example
    ├── .gitignore
    ├── AGENTS.md
    ├── README.md
    ├── eslint.config.mjs
    ├── next.config.ts
    ├── package.json
    ├── package-lock.json
    ├── tsconfig.json
    ├── app/
    │   ├── favicon.ico
    │   ├── globals.css
    │   ├── layout.tsx
    │   ├── page.tsx
    │   ├── (auth)/login/page.tsx (vista: página de inicio de sesión)
    │   ├── (app)/home/page.tsx (ruta de la pantalla principal)
    │   └── api/
    │       ├── login/route.ts    (reenvía el login al backend y guarda la cookie)
    │       └── test-db/route.ts  (prueba de conexión, solo en desarrollo)
    ├── components/
    │   ├── auth/LoginForm.tsx    (vista: formulario)
    │   ├── home/HomeScreen.tsx (vista: pantalla principal)
    │   └── ui/LoadingDots.tsx
    ├── lib/
    │   ├── apiClient.ts          (cliente HTTP)
    │   ├── db.ts                 (patrón Singleton: conexión a SQL Server)
    │   ├── loginState.ts         (patrón Estado: estados del formulario)
    │   └── loginValidation.ts    (validación del formulario)
    ├── public/                   (imágenes, fuente y animaciones)
    ├── services/
    │   └── authService.ts        (comunicación con /api/login)
    └── types/
        └── auth.ts               (modelo del inicio de sesión)
```

ASP.NET Core concentra el backend y Next.js presenta la interfaz. La organización por capas y los patrones de diseño se explican en [05. Arquitectura, SOLID y patrones](../planes/01-arquitectura-y-patrones.md).

## 4. Dependencias declaradas por el proyecto

No instales estas bibliotecas globalmente. Los comandos de instalación de cada componente las recuperan desde sus manifiestos.

### Frontend

Las dependencias principales declaradas en `frontend/package.json` son:

- Next.js 16.4.0.
- React 19.3.0 y React DOM 19.3.0.
- TypeScript 5.
- Tailwind CSS 4 y `@tailwindcss/turbopack`.
- ESLint 9 y `eslint-config-next` 16.4.0.
- Tipos de Node.js, React y React DOM.

`frontend/package-lock.json` fija el árbol resuelto. Usa `npm ci` para instalarlo de forma reproducible; no borres ni regeneres el lockfile durante la instalación.

### Backend

El proyecto ASP.NET Core apunta a .NET 8 e incluye estos paquetes NuGet:

- `Microsoft.EntityFrameworkCore.SqlServer` 8.0.* para el proveedor SQL Server de Entity Framework Core.
- `Microsoft.EntityFrameworkCore.Design` 8.0.* para tareas de diseño y migraciones.
- `Microsoft.AspNetCore.Authentication.JwtBearer` 8.0.* para autenticación JWT.
- `BCrypt.Net-Next` 4.2.0 para hashing de contraseñas.
- `Swashbuckle.AspNetCore` 6.6.2 para Swagger/OpenAPI.

`dotnet restore` descarga las dependencias declaradas.

### Servicio de IA

`ai-service/requirements.txt` declara estas versiones fijadas: `annotated-doc` 0.0.5, `annotated-types` 0.8.0, AnyIO 4.15.1, Click 8.5.0, FastAPI 0.143.0, h11 0.16.0, httptools 0.8.0, idna 3.20, OpenTelemetry API 1.45.1, Pydantic 2.14.0, pydantic-core 2.50.0, `python-dotenv` 1.2.4, PyYAML 6.0.3, Starlette 1.7.0, typing-inspection 0.4.4, typing-extensions 4.16.0, Uvicorn 0.54.0, watchfiles 1.3.0 y websockets 17.2.

El archivo `ai-service/app/main.py` está vacío actualmente. Por ello no existe una aplicación ASGI que pueda arrancarse con Uvicorn, y no es necesario instalar estas dependencias para iniciar el frontend o la API. Cuando se implemente ese servicio, se podrá crear un entorno virtual e instalar el manifiesto con pip.

## 5. Arrancar el backend ASP.NET Core

### 5.1 Configurar los secretos (una sola vez por equipo)

La cadena de conexión y la clave de firma de los tokens **no se guardan en el código ni en `appsettings.json`**. En desarrollo se guardan con *user-secrets* de .NET, fuera de la carpeta del repositorio, en el perfil de tu usuario de Windows. Desde la raíz del repositorio:

```powershell
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=localhost;Database=XpertDiagnostic;Trusted_Connection=True;TrustServerCertificate=True" --project backend\XpertDiagnostic.Api
dotnet user-secrets set "Jwt:Key" "<clave aleatoria de al menos 32 caracteres>" --project backend\XpertDiagnostic.Api
```

Ajusta la cadena de conexión a tu instancia. Si usas autenticación de SQL Server, cambia `Trusted_Connection=True` por `User Id=...;Password=...`. Para generar una clave aleatoria:

```powershell
[Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(48))
```

Puedes revisar lo configurado con `dotnet user-secrets list --project backend\XpertDiagnostic.Api`. En servidores o en producción se usan variables de entorno en su lugar: `ConnectionStrings__DefaultConnection` y `Jwt__Key`.

Si falta alguno de los dos valores, o si la clave tiene menos de 32 caracteres, la API **no arranca** y muestra un mensaje que indica qué falta.

### 5.2 Ejecutar la API

Restaura y ejecuta la API:

```powershell
dotnet restore backend\XpertDiagnostic.sln
dotnet run --project backend\XpertDiagnostic.Api\XpertDiagnostic.Api.csproj --launch-profile http
```

El perfil `http` define la dirección local `http://localhost:5140`. En modo de desarrollo, Swagger está habilitado; abre esta dirección en el navegador:

```text
http://localhost:5140/swagger
```

Deja esta terminal abierta mientras uses la API. Para detenerla, presiona `Ctrl+C`.

Swagger muestra `POST /api/auth/login` y `GET /api/health/db`. Este último indica si la API puede conectarse a SQL Server.

### 5.3 Ejecutar las pruebas

```powershell
dotnet test backend\XpertDiagnostic.sln --filter "Categoria!=Integracion"
```

El filtro omite la prueba de integración `PT02`, que necesita la API ejecutándose. Los casos de prueba completos están en [04. Pruebas TDD](../especificaciones/04-pruebas-tdd.md).

## 6. Arrancar el frontend Next.js

Abre una segunda terminal PowerShell en la raíz del repositorio. Crea tu archivo de configuración local a partir del ejemplo. `.env.local` no se sube al repositorio:

```powershell
Set-Location frontend
Copy-Item .env.example .env.local
```

`BACKEND_API_URL` ya apunta a `http://localhost:5140`. Las variables `DB_*` solo las usa la ruta de diagnóstico `/api/test-db`.

Instala las dependencias y arranca el servidor:

```powershell
npm ci
npm run dev
```

Cuando Next.js indique que el servidor está listo, visita:

```text
http://localhost:3000
```

Deja la terminal abierta. Para detener el servidor, presiona `Ctrl+C`. Para una compilación de producción local, desde `frontend` ejecuta:

```powershell
npm run build
npm run start
```

El formulario envía las credenciales a `/api/login`. Esa ruta de Next.js las reenvía a la API y, si son correctas, guarda el token en una cookie `httpOnly`. Para iniciar sesión, la API debe estar ejecutándose (sección 5).

## 7. SQL Server y servicio de IA

### SQL Server

La API trabaja sobre una base de datos `XpertDiagnostic` existente. Entity Framework Core mapea la tabla `dbo.USUARIOS` con las columnas `IdUSUARIO`, `PASS`, `ROL`, `IdMEDICO` e `IdAREA`. No hay migraciones de Entity Framework: no ejecutes `dotnet ef database update`.

Para el inicio de sesión, ejecuta `backend\XpertDiagnostic.Api\Sql\CreateDoctorsAndUsersTables.sql`, que crea `dbo.MEDICOS` (nombre, especialidad y cédula profesional) y `dbo.USUARIOS` (la cuenta médica: `IdUSUARIO = IdMEDICO`, `PASS` con hash BCrypt, `ROL` `T` tratante, `I` internista o `A` administrador, y `BienvenidaVista`). Si `USUARIOS` ya existía, el script la adapta dentro de una transacción, migra las cuentas `M` a `T` y actualiza las restricciones: `T` e `I` requieren un registro en `MEDICOS`; `A` puede tener `IdMEDICO` nulo.

Para datos de demostración, después del script de esquema puedes ejecutar `SeedAdminAccount.sql` (ID `654321`, contraseña inicial `admin`) y `SeedInternistAccount.sql` (ID `654322`, contraseña inicial `admin`). Ambos son solo para desarrollo. En producción no ejecutes los seeds; las cuentas se administran desde la app y las contraseñas de demostración deben cambiarse antes de exponer el entorno.

Para crear y llenar las tablas clínicas (enfermedades, síntomas, signos, estudios, tratamientos, pacientes de prueba y sus hallazgos), ejecuta en SSMS, con la base `XpertDiagnostic` seleccionada y en este orden:

1. `backend\XpertDiagnostic.Api\Sql\CreateClinicalTables.sql` (y `CreateDoctorsAndUsersTables.sql` para médicos y cuentas): crea solo las tablas que falten; no toca `dbo.USUARIOS`.
2. `backend\XpertDiagnostic.Api\Sql\SeedClinicalData.sql`: borra y recarga los datos clínicos en una sola transacción. Se puede repetir.

Los datos vienen de los CSV de `Sql\ClinicalData` (Windows-1252). `SeedClinicalData.sql` no se edita a mano: si cambia un CSV, se vuelve a generar con `python backend/XpertDiagnostic.Api/Sql/Tools/generate_clinical_seed.py`. El generador valida llaves y referencias y no escribe nada si encuentra errores.

No guardes contraseñas ni cadenas de conexión reales en archivos que vayan a GitHub. Usa la configuración de la sección 5.1.

### Servicio de IA

El directorio `ai-service` es únicamente una estructura inicial. Como `main.py` está vacío, no intentes iniciar `uvicorn app.main:app`; el servicio no tiene una instancia `app` que Uvicorn pueda cargar. Su instalación y arranque se documentarán cuando se implemente la aplicación FastAPI.

## 8. Problemas frecuentes

- **`node` o `npm` no se reconoce:** instala Node.js LTS, cierra y vuelve a abrir PowerShell, y repite `node --version` y `npm --version`.
- **La versión de Node.js es inferior a 20.9:** instala una versión compatible y vuelve a abrir la terminal.
- **`dotnet` no se reconoce o no aparece el SDK 8:** instala el .NET 8 SDK, no únicamente el runtime; reinicia PowerShell y comprueba `dotnet --list-sdks`.
- **El puerto 3000 está ocupado:** detén el proceso anterior o ejecuta `npm run dev -- --port 3001`; después abre `http://localhost:3001`.
- **El puerto 5140 está ocupado:** cierra otra instancia del backend o ajusta `applicationUrl` en `backend\XpertDiagnostic.Api\Properties\launchSettings.json` y usa el nuevo puerto.
- **Swagger no carga:** confirma que la API sigue ejecutándose, que usaste el perfil `http` y que abriste `http://localhost:5140/swagger`.
- **La API se detiene al arrancar con un mensaje sobre `ConnectionStrings:DefaultConnection` o `Jwt:Key`:** falta configurar los secretos o la clave tiene menos de 32 caracteres. Repite la sección 5.1.
- **El inicio de sesión muestra "No se pudo iniciar sesión. Inténtalo de nuevo.":** la API no está ejecutándose o no llega a SQL Server. Abre `http://localhost:5140/api/health/db` para comprobarlo.
- **La aplicación no conecta con SQL Server:** confirma que el servicio de SQL Server está iniciado y que la cadena de conexión de user-secrets apunta a la instancia y a la base correctas.
- **Una biblioteca no se restaura:** comprueba tu conexión a Internet y vuelve a intentar `npm ci` o `dotnet restore` desde la carpeta indicada.

## 9. Flujo de trabajo para contribuir

Para enviar cambios, trabaja desde un clon Git, no desde un ZIP. El repositorio usa dos ramas principales:

- `main`: rama estable (producción). Solo recibe versiones probadas que vienen de `Develop`.
- `Develop`: rama de integración. Todas las ramas de trabajo parten de aquí y regresan aquí mediante Pull Request.

No desarrolles directamente sobre `Develop` ni sobre `main`.

Actualiza la rama base y crea una rama para cada cambio:

```powershell
git switch Develop
git pull origin Develop
git switch -c feature/descripcion-corta
```

Usa `fix/descripcion-corta` para una corrección, `docs/descripcion-corta` para documentación o `refactor/descripcion-corta` para una reorganización interna. El nombre debe describir el cambio, sin espacios ni acentos.

Antes de confirmar, revisa exactamente qué vas a incluir:

```powershell
git status --short
git diff --check
git diff
```

Prepara los archivos que correspondan y vuelve a revisar lo preparado:

```powershell
git add ruta\del\archivo
git diff --cached --check
git diff --cached
git status --short
```

No uses `git add .` o `git add -A` sin revisar antes el estado: podrían incluir archivos locales, configuraciones privadas o salidas de compilación. No subas `.env`, `.env.local`, claves, contraseñas, tokens, `node_modules`, `.next`, `bin`, `obj` ni `.venv`.

## 10. Escribir buenos mensajes de commit

Usa el formato:

```text
tipo(alcance): descripción breve en imperativo
```

Empieza con minúscula, usa una descripción clara y evita mensajes como `cambios`, `actualización` o `arreglo`. Tipos recomendados:

- `feat`: agrega funcionalidad.
- `fix`: corrige un error.
- `docs`: cambia documentación.
- `refactor`: reorganiza código sin cambiar su comportamiento esperado.
- `test`: añade o modifica pruebas.
- `chore`: mantenimiento de herramientas o configuración.

Ejemplos:

```text
feat(auth): agrega endpoint de inicio de sesión
fix(frontend): corrige validación del formulario
docs(install): agrega guía para Windows
refactor(backend): separa la lógica de autenticación
```

Confirma y sube tu rama:

```powershell
git commit -m "docs(install): agrega guía para Windows"
git push -u origin feature/descripcion-corta
```

Sustituye el mensaje de ejemplo y el nombre de rama por los de tu cambio. Si `git push` indica que la rama ya tiene seguimiento remoto, en los siguientes envíos basta con:

```powershell
git push
```

## 11. Crear un Pull Request hacia `Develop`

1. En GitHub, abre el repositorio y selecciona **Compare & pull request** para la rama que acabas de subir.
2. Confirma que la rama de destino (**base**) sea `Develop` y que la rama de origen (**compare**) sea tu rama de trabajo.
3. Escribe un título claro y explica qué cambió, cómo se probó y cualquier pendiente conocido.
4. Revisa la pestaña **Files changed** y confirma que no se incluyan secretos ni archivos generados.
5. Espera las revisiones y verificaciones automatizadas configuradas en el repositorio.
6. Corrige los comentarios necesarios, envía los nuevos commits a la misma rama y espera a que GitHub actualice el PR.
7. Cuando esté aprobado y las comprobaciones pasen, usa la opción de merge acordada por el equipo. No hagas push directo a `Develop`.

Nunca abras un Pull Request de tu rama de trabajo hacia `main`. El paso de `Develop` a `main` se hace con un Pull Request aparte cuando el equipo decide publicar una versión estable.

## 12. Cerrar la copia local después del merge

Cuando el PR ya se haya integrado, actualiza tu rama base:

```powershell
git switch Develop
git pull origin Develop
```

Puedes borrar la rama local solo después de confirmar que el PR se integró y que ya no necesitas trabajar en ella:

```powershell
git branch -d feature/descripcion-corta
```

No borres ramas con cambios pendientes o que todavía no se hayan integrado.
