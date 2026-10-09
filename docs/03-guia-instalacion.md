# Guía de instalación y colaboración

Esta guía explica cómo descargar el repositorio, preparar las herramientas y arrancar los componentes disponibles en Windows. Está escrita para la estructura actual del repositorio; el backend, la base de datos y el servicio de IA todavía son un esqueleto en desarrollo.

> Importante: que el frontend y la API arranquen no significa que el sistema ya funcione de extremo a extremo. La API todavía no configura una conexión a SQL Server, no hay migraciones ni datos iniciales, y el servicio de IA no tiene una aplicación ejecutable. El formulario de inicio de sesión tampoco puede completar una autenticación funcional.

## 1. Requisitos de equipo y programas

Se recomienda Windows 10 u 11 de 64 bits, conexión a Internet durante la instalación de dependencias y permisos para instalar herramientas.

Instala lo siguiente desde sus sitios oficiales:

- [**Git for Windows**](https://git-scm.com/download/win), para clonar el repositorio y trabajar con ramas. No se necesita para descargar y ejecutar solamente una copia ZIP.
- [**Node.js 22 LTS o posterior compatible**](https://nodejs.org/en/download) y npm, para el frontend. Next.js en este proyecto requiere Node.js 20.9.0 como mínimo; se recomienda una versión LTS vigente que cumpla ese mínimo. npm se instala junto con Node.js.
- [**.NET 8 SDK**](https://dotnet.microsoft.com/download/dotnet/8.0), no solo el runtime, para restaurar, compilar y ejecutar el backend ASP.NET Core.
- [**Python 3.12**](https://www.python.org/downloads/), para preparar el entorno previsto para el servicio de IA cuando ese componente tenga una aplicación implementada.
- [**SQL Server Developer o Express**](https://www.microsoft.com/sql-server/sql-server-downloads) y, opcionalmente, [**SQL Server Management Studio (SSMS)**](https://learn.microsoft.com/sql/ssms/download-sql-server-management-studio-ssms), para el desarrollo de la base de datos cuando el backend tenga la conexión configurada. La API actual no necesita una instancia SQL Server para arrancar.
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

**[Pega aquí la imagen 1: herramientas instaladas y versiones en PowerShell.]**

## 2. Descargar el proyecto

### Opción A: descargar como ZIP

1. Abre el repositorio de XpertDiagnostic en GitHub.
2. En el selector de ramas, selecciona `database` si deseas descargar el estado de esa rama.
3. Abre el menú **Code** y selecciona **Download ZIP**.
4. Extrae el ZIP en una carpeta de trabajo, por ejemplo `C:\Proyectos\XpertDiagnostic`.
5. Abre esa carpeta extraída en el Explorador de archivos y escribe `powershell` en la barra de dirección para abrir una terminal en la raíz del proyecto.

Un ZIP no contiene la carpeta interna `.git`. Sirve para consultar y ejecutar una copia, pero no permite crear ramas, confirmar cambios ni hacer push. Para colaborar, sigue la opción B.

**[Pega aquí la imagen 2: selector de rama y menú Code > Download ZIP.]**

**[Pega aquí la imagen 3: ZIP extraído y terminal PowerShell abierta en la raíz.]**

### Opción B: clonar para contribuir

Abre PowerShell en el directorio donde quieras guardar el repositorio y ejecuta:

```powershell
git clone --branch database https://github.com/lucybits/XpertDiagnostic.git
Set-Location XpertDiagnostic
```

Confirma que la copia quedó en la rama base prevista:

```powershell
git status --short --branch
git branch --show-current
```

Debe aparecer `database` como rama actual y un árbol de trabajo limpio.

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
│   └── XpertDiagnostic.Api/
│       ├── XpertDiagnostic.Api.csproj
│       ├── XpertDiagnostic.Api.http
│       ├── Program.cs
│       ├── appsettings.json
│       ├── appsettings.Development.json
│       ├── Controllers/
│       │   └── AuthController.cs
│       ├── Data/
│       │   └── AppDbContext.cs
│       ├── Models/
│       │   ├── DTOs/
│       │   │   ├── LoginRequest.cs
│       │   │   └── LoginResponse.cs
│       │   └── Entities/
│       │       └── Usuario.cs
│       ├── Properties/
│       │   └── launchSettings.json
│       ├── Repositories/
│       │   ├── IUsuarioRepository.cs
│       │   └── UsuarioRepository.cs
│       └── Services/
│           ├── AuthService.cs
│           ├── JwtTokenService.cs
│           └── Interfaces/
│               └── IAuthService.cs
├── docs/
│   ├── README.md
│   ├── 01-introduccion.md
│   ├── 02-requisitos.md
│   └── 03-guia-instalacion.md
└── frontend/
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
    │   └── (auth)/
    │       └── login/
    │           └── page.tsx
    ├── components/
    │   └── auth/
    │       └── LoginForm.tsx
    ├── lib/
    │   └── apiClient.ts
    ├── public/
    │   ├── Medical-Research--Streamline-Brooklyn.png
    │   ├── file.svg
    │   ├── footer-image.png
    │   ├── globe.svg
    │   ├── image.jpg
    │   ├── logo-header.png
    │   ├── next.svg
    │   ├── vercel.svg
    │   └── window.svg
    ├── services/
    │   └── authService.ts
    └── types/
        └── auth.ts
```

En la separación actual, ASP.NET Core concentra el backend y Next.js presenta la interfaz. Algunos archivos de estructura aún están vacíos o en construcción.

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

`dotnet restore` descarga las dependencias declaradas. Aunque el proveedor SQL Server está instalado como paquete, el contexto y la conexión todavía no están configurados.

### Servicio de IA

`ai-service/requirements.txt` declara estas versiones fijadas: `annotated-doc` 0.0.5, `annotated-types` 0.8.0, AnyIO 4.15.1, Click 8.5.0, FastAPI 0.143.0, h11 0.16.0, httptools 0.8.0, idna 3.20, OpenTelemetry API 1.45.1, Pydantic 2.14.0, pydantic-core 2.50.0, `python-dotenv` 1.2.4, PyYAML 6.0.3, Starlette 1.7.0, typing-inspection 0.4.4, typing-extensions 4.16.0, Uvicorn 0.54.0, watchfiles 1.3.0 y websockets 17.2.

El archivo `ai-service/app/main.py` está vacío actualmente. Por ello no existe una aplicación ASGI que pueda arrancarse con Uvicorn, y no es necesario instalar estas dependencias para iniciar el frontend o la API. Cuando se implemente ese servicio, se podrá crear un entorno virtual e instalar el manifiesto con pip.

## 5. Arrancar el backend ASP.NET Core

Abre una terminal PowerShell en la raíz del repositorio. Restaura y ejecuta la API:

```powershell
dotnet restore backend\XpertDiagnostic.sln
dotnet run --project backend\XpertDiagnostic.Api\XpertDiagnostic.Api.csproj --launch-profile http
```

El perfil `http` define la dirección local `http://localhost:5140`. En modo de desarrollo, Swagger está habilitado; abre esta dirección en el navegador:

```text
http://localhost:5140/swagger
```

Deja esta terminal abierta mientras uses la API. Para detenerla, presiona `Ctrl+C`.

Swagger puede mostrar una API sin operaciones: el proyecto todavía no tiene controladores implementados. El comando confirma que el esqueleto ASP.NET Core arranca, no que los endpoints de login o SQL Server ya funcionen.

**[Pega aquí la imagen 4: restauración y arranque de ASP.NET Core en PowerShell.]**

**[Pega aquí la imagen 5: Swagger abierto en http://localhost:5140/swagger.]**

## 6. Arrancar el frontend Next.js

Abre una segunda terminal PowerShell en la raíz del repositorio e instala las dependencias:

```powershell
Set-Location frontend
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

El formulario que se muestra es solo interfaz por ahora. Su envío apunta a `/api/login`, pero esa ruta no existe en la estructura actual; por tanto, el inicio de sesión no se completa.

**[Pega aquí la imagen 6: instalación npm ci y servidor Next.js listo.]**

**[Pega aquí la imagen 7: interfaz de XpertDiagnostic abierta en http://localhost:3000.]**

## 7. SQL Server y servicio de IA

### SQL Server

SQL Server es parte de la arquitectura prevista, pero no hace falta instalarlo para probar que los proyectos de frontend y API arrancan. La conexión no está declarada en `appsettings.json` ni `appsettings.Development.json`, `AppDbContext.cs` está vacío y no hay migraciones ni script de creación de base de datos.

No ejecutes todavía `dotnet ef database update`: no hay un modelo de Entity Framework ni migraciones preparados. Cuando se implemente esa parte, el equipo deberá documentar el nombre de la base, la cadena de conexión, cómo crearla y cómo aplicar las migraciones. No guardes contraseñas ni cadenas de conexión reales en archivos que vayan a GitHub.

### Servicio de IA

El directorio `ai-service` es únicamente una estructura inicial. Como `main.py` está vacío, no intentes iniciar `uvicorn app.main:app`; el servicio no tiene una instancia `app` que Uvicorn pueda cargar. Su instalación y arranque se documentarán cuando se implemente la aplicación FastAPI.

## 8. Problemas frecuentes

- **`node` o `npm` no se reconoce:** instala Node.js LTS, cierra y vuelve a abrir PowerShell, y repite `node --version` y `npm --version`.
- **La versión de Node.js es inferior a 20.9:** instala una versión compatible y vuelve a abrir la terminal.
- **`dotnet` no se reconoce o no aparece el SDK 8:** instala el .NET 8 SDK, no únicamente el runtime; reinicia PowerShell y comprueba `dotnet --list-sdks`.
- **El puerto 3000 está ocupado:** detén el proceso anterior o ejecuta `npm run dev -- --port 3001`; después abre `http://localhost:3001`.
- **El puerto 5140 está ocupado:** cierra otra instancia del backend o ajusta `applicationUrl` en `backend\XpertDiagnostic.Api\Properties\launchSettings.json` y usa el nuevo puerto.
- **Swagger no carga:** confirma que la API sigue ejecutándose, que usaste el perfil `http` y que abriste `http://localhost:5140/swagger`.
- **La autenticación no responde:** es una función pendiente; la página todavía no está conectada a un endpoint de login implementado.
- **La aplicación no conecta con SQL Server:** esa conexión todavía no forma parte del código disponible.
- **Una biblioteca no se restaura:** comprueba tu conexión a Internet y vuelve a intentar `npm ci` o `dotnet restore` desde la carpeta indicada.

## 9. Flujo de trabajo para contribuir

Para enviar cambios, trabaja desde un clon Git, no desde un ZIP. No desarrolles directamente sobre `database`, que es la rama base/producción del flujo acordado.

Actualiza la rama base y crea una rama para cada cambio:

```powershell
git switch database
git pull origin database
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

**[Pega aquí la imagen 8: rama de trabajo creada y cambios revisados con git status.]**

## 11. Crear un Pull Request hacia `database`

1. En GitHub, abre el repositorio y selecciona **Compare & pull request** para la rama que acabas de subir.
2. Confirma que la rama de destino (**base**) sea `database` y que la rama de origen (**compare**) sea tu rama de trabajo.
3. Escribe un título claro y explica qué cambió, cómo se probó y cualquier pendiente conocido.
4. Revisa la pestaña **Files changed** y confirma que no se incluyan secretos ni archivos generados.
5. Espera las revisiones y verificaciones automatizadas configuradas en el repositorio.
6. Corrige los comentarios necesarios, envía los nuevos commits a la misma rama y espera a que GitHub actualice el PR.
7. Cuando esté aprobado y las comprobaciones pasen, usa la opción de merge acordada por el equipo. No hagas push directo a `database`.

**[Pega aquí la imagen 9: Pull Request con base database y compare en la rama de trabajo.]**

**[Pega aquí la imagen 10: revisión de Files changed y comprobaciones antes del merge.]**

## 12. Cerrar la copia local después del merge

Cuando el PR ya se haya integrado, actualiza tu rama base:

```powershell
git switch database
git pull origin database
```

Puedes borrar la rama local solo después de confirmar que el PR se integró y que ya no necesitas trabajar en ella:

```powershell
git branch -d feature/descripcion-corta
```

No borres ramas con cambios pendientes o que todavía no se hayan integrado.
