/*
    Médicos y cuentas de usuario (las mapean Models/Entities/Doctor.cs y User.cs).

    - MEDICOS identifica al médico: nombre, especialidad y cédula profesional.
    - USUARIOS es la cuenta de acceso. ROL: 'T' tratante, 'I' internista, 'A' administrador.
        · Una cuenta médica ('T' o 'I') siempre apunta a su registro en MEDICOS y usa el mismo número
          (Id_Usuario = Id_Medico): con ese número inicia sesión.
        · Una cuenta de administrador ('A') no necesita registro en MEDICOS (Id_Medico NULL), así no se
          inventan cédulas para cuentas que no son de médicos (P-116).
        · Activo = 0 bloquea el inicio de sesión y las sesiones abiertas sin borrar datos (baja lógica).
        · FechaRegistro: alta de la cuenta, en UTC.
      Id_Area es opcional (sin tabla).

    Ejecutar en la base XpertDiagnostic. Se puede repetir:
      - crea lo que falte;
      - si USUARIOS ya existía (versión anterior de este script o esquema anterior), la adapta sin perder
        registros: Id_Area e Id_Medico opcionales, Activo, FechaRegistro, reglas de ROL y
        llave foránea a MEDICOS. Todo dentro de una transacción: si algo falla, no queda a medias.
    No inserta registros: las cuentas se crean desde el panel de administración o mediante los seeds de
    prueba SeedAdminAccount.sql y SeedInternistAccount.sql.
*/

SET NOCOUNT ON;
SET XACT_ABORT ON;

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 50010, 'Selecciona la base de datos XpertDiagnostic antes de ejecutar este script.', 1;

BEGIN TRANSACTION;

IF OBJECT_ID(N'dbo.MEDICOS', N'U') IS NULL
CREATE TABLE dbo.MEDICOS (
    Id_Medico          INT           NOT NULL CONSTRAINT PK_MEDICOS PRIMARY KEY,
    NombreCompleto    NVARCHAR(120) NOT NULL,
    Especialidad      NVARCHAR(80)  NOT NULL,
    CedulaProfesional VARCHAR(8)    NOT NULL CONSTRAINT UQ_MEDICOS_CEDULA UNIQUE,
    CONSTRAINT CK_MEDICOS_CEDULA CHECK (LEN(CedulaProfesional) BETWEEN 7 AND 8 AND CedulaProfesional NOT LIKE '%[^0-9]%')
);

IF OBJECT_ID(N'dbo.USUARIOS', N'U') IS NULL
CREATE TABLE dbo.USUARIOS (
    Id_Usuario       INT          NOT NULL CONSTRAINT PK_USUARIOS PRIMARY KEY,
    PASS            VARCHAR(60)  NOT NULL, -- hash BCrypt
    ROL             VARCHAR(1)   NOT NULL CONSTRAINT CK_USUARIOS_ROL CHECK (ROL IN ('T', 'I', 'A')),
    Id_Medico        INT          NULL CONSTRAINT FK_USUARIOS_MEDICOS REFERENCES dbo.MEDICOS (Id_Medico),
    Id_Area          INT          NULL,
    Activo          BIT          NOT NULL CONSTRAINT DF_USUARIOS_ACTIVO DEFAULT (1),
    FechaRegistro   DATETIME2(0) NOT NULL CONSTRAINT DF_USUARIOS_FECHA_REGISTRO DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT CK_USUARIOS_MEDICO_ROL CHECK ((ROL IN ('T', 'I') AND Id_Medico IS NOT NULL) OR ROL = 'A'),
    CONSTRAINT CK_USUARIOS_MEDICO_ID CHECK (Id_Medico IS NULL OR Id_Medico = Id_Usuario)
);

-- ── Adaptación de una USUARIOS creada antes ──────────────────────────────────────────────────
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.USUARIOS') AND name = N'Id_Area' AND is_nullable = 0)
    ALTER TABLE dbo.USUARIOS ALTER COLUMN Id_Area INT NULL;

-- Las cuentas existentes quedan activas y con fecha de registro igual al momento de la adaptación.
IF COL_LENGTH(N'dbo.USUARIOS', N'Activo') IS NULL
    ALTER TABLE dbo.USUARIOS ADD Activo BIT NOT NULL CONSTRAINT DF_USUARIOS_ACTIVO DEFAULT (1);

IF COL_LENGTH(N'dbo.USUARIOS', N'FechaRegistro') IS NULL
    ALTER TABLE dbo.USUARIOS ADD FechaRegistro DATETIME2(0) NOT NULL
        CONSTRAINT DF_USUARIOS_FECHA_REGISTRO DEFAULT (SYSUTCDATETIME());

IF OBJECT_ID(N'dbo.CK_USUARIOS_ROL', N'C') IS NOT NULL
    ALTER TABLE dbo.USUARIOS DROP CONSTRAINT CK_USUARIOS_ROL;

IF OBJECT_ID(N'dbo.CK_USUARIOS_MEDICO_ROL', N'C') IS NOT NULL
    ALTER TABLE dbo.USUARIOS DROP CONSTRAINT CK_USUARIOS_MEDICO_ROL;

UPDATE dbo.USUARIOS
SET ROL = 'T'
WHERE ROL = 'M';

ALTER TABLE dbo.USUARIOS WITH CHECK
    ADD CONSTRAINT CK_USUARIOS_ROL CHECK (ROL IN ('T', 'I', 'A'));

-- Id_Medico opcional (solo para administradores). SQL Server no deja cambiar una columna con llave
-- foránea, así que se quita la llave, se cambia la columna y la llave se vuelve a crear abajo.
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.USUARIOS') AND name = N'Id_Medico' AND is_nullable = 0)
BEGIN
    IF OBJECT_ID(N'dbo.FK_USUARIOS_MEDICOS', N'F') IS NOT NULL
        ALTER TABLE dbo.USUARIOS DROP CONSTRAINT FK_USUARIOS_MEDICOS;
    ALTER TABLE dbo.USUARIOS ALTER COLUMN Id_Medico INT NULL;
END

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE parent_object_id = OBJECT_ID(N'dbo.USUARIOS') AND referenced_object_id = OBJECT_ID(N'dbo.MEDICOS'))
BEGIN
    IF EXISTS (SELECT 1 FROM dbo.USUARIOS u WHERE u.Id_Medico IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.MEDICOS m WHERE m.Id_Medico = u.Id_Medico))
        PRINT 'Aviso: hay usuarios sin médico en MEDICOS; regístralos y vuelve a ejecutar este script para agregar la llave foránea.';
    ELSE
        ALTER TABLE dbo.USUARIOS ADD CONSTRAINT FK_USUARIOS_MEDICOS FOREIGN KEY (Id_Medico) REFERENCES dbo.MEDICOS (Id_Medico);
END

-- Reglas entre columnas. Se crean con SQL dinámico porque Id_Medico pudo cambiar en este mismo lote.
EXEC (N'ALTER TABLE dbo.USUARIOS WITH CHECK ADD CONSTRAINT CK_USUARIOS_MEDICO_ROL CHECK ((ROL IN (''T'', ''I'') AND Id_Medico IS NOT NULL) OR ROL = ''A'');');

IF OBJECT_ID(N'dbo.CK_USUARIOS_MEDICO_ID', N'C') IS NULL
BEGIN
    IF EXISTS (SELECT 1 FROM dbo.USUARIOS WHERE Id_Medico IS NOT NULL AND Id_Medico <> Id_Usuario)
        PRINT 'Aviso: hay usuarios cuyo Id_Medico no coincide con su Id_Usuario; corrígelos y vuelve a ejecutar este script.';
    ELSE
        EXEC (N'ALTER TABLE dbo.USUARIOS ADD CONSTRAINT CK_USUARIOS_MEDICO_ID CHECK (Id_Medico IS NULL OR Id_Medico = Id_Usuario);');
END

COMMIT TRANSACTION;

PRINT 'Tablas MEDICOS y USUARIOS listas.';
